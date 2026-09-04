import { ConfigJsonError, fetchConfigJson, isMissingResource, JsonMode, resolveJsonMode } from './JsonParser';
import { NitroLogger } from './NitroLogger';

export const DEFAULT_TIERS = [ 'core', 'custom', 'seasonal' ] as const;
export type GamedataTier = typeof DEFAULT_TIERS[number] | string;

export interface GamedataLoadOptions
{
    tiers?: readonly GamedataTier[];
    mergeArrayIdKeys?: readonly string[];
}

const DEFAULT_ID_KEYS = [ 'id', 'classname', 'name' ] as const;

const looksLikeDirectory = (url: string): boolean =>
{
    if(!url) return false;

    const stripped = url.split('?')[0].split('#')[0];

    return stripped.endsWith('/');
};

const joinUrl = (base: string, path: string): string =>
{
    const cleanBase = base.endsWith('/') ? base : `${ base }/`;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    return `${ cleanBase }${ cleanPath }`;
};

// Returns the parsed payload when the manifest exists, null on a clean 404.
// Re-throws on any other error so malformed JSONC never becomes a missing tier.
const tryFetchManifest = async <T = any>(url: string): Promise<T | null> =>
{
    try
    {
        return await fetchConfigJson<T>(url);
    }
    catch (err)
    {
        if(isMissingResource(err)) return null;
        throw err;
    }
};

// Pick manifest extensions from the active mode. A clean 404 advances to the
// next candidate; network and parse failures remain visible to the caller.
export const manifestCandidates = (mode: JsonMode, name: string = 'manifest'): readonly string[] =>
{
    if(mode === 'legacy') return [ `${ name }.json` ];
    if(mode === 'jsonc') return [ `${ name }.jsonc` ];

    return [ `${ name }.jsonc`, `${ name }.json` ];
};

const tryFetchManifestPair = async <T = any>(baseUrl: string, name: string, mode: JsonMode): Promise<T | null> =>
{
    for(const candidate of manifestCandidates(mode, name))
    {
        const result = await tryFetchManifest<T>(joinUrl(baseUrl, candidate));

        if(result !== null) return result;
    }

    return null;
};

const isPlainObject = (value: any): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);

const arrayItemsLookKeyed = (arr: any[], idKeys: readonly string[], sourceLabel?: string): string | null =>
{
    if(!arr.length) return null;

    for(const key of idKeys)
    {
        let have = 0;

        for(const item of arr)
        {
            if(isPlainObject(item) && item[key] !== undefined && item[key] !== null) have++;
        }

        if(have === arr.length) return key;

        // Heuristic: if most items are keyed but a few are not, the data is
        // probably keyed and the outliers are bugs in the source data.
        // Surface this so operators don't get silent duplicates after merge.
        if(have > 0 && have / arr.length >= 0.8)
        {
            NitroLogger.warn(`mergeGamedata: ${ sourceLabel ? `${ sourceLabel }: ` : '' }array looks keyed by "${ key }" (${ have }/${ arr.length } items) but some entries are missing it — falling back to concat which may produce duplicates`);
        }
    }

    return null;
};

export const mergeGamedata = (a: any, b: any, idKeys: readonly string[] = DEFAULT_ID_KEYS, sourceLabel?: string): any =>
{
    if(b === undefined) return a;
    if(a === undefined) return b;

    if(Array.isArray(a) && Array.isArray(b))
    {
        const idKey = arrayItemsLookKeyed(a, idKeys, sourceLabel) || arrayItemsLookKeyed(b, idKeys, sourceLabel);

        if(!idKey) return a.concat(b);

        const index = new Map<any, number>();
        const out: any[] = [];

        for(const item of a)
        {
            index.set(item[idKey], out.length);
            out.push(item);
        }

        for(const item of b)
        {
            const key = item[idKey];
            const at = index.get(key);

            if(at !== undefined)
            {
                out[at] = mergeGamedata(out[at], item, idKeys, sourceLabel);
            }
            else
            {
                index.set(key, out.length);
                out.push(item);
            }
        }

        return out;
    }

    if(isPlainObject(a) && isPlainObject(b))
    {
        const out: Record<string, any> = { ...a };

        for(const key of Object.keys(b))
        {
            out[key] = mergeGamedata(a[key], b[key], idKeys, sourceLabel);
        }

        return out;
    }

    return b;
};

interface TierManifest
{
    files?: string[];
}

interface RootManifest
{
    tiers?: GamedataTier[];
    files?: string[];
}

// Load every file in `files` concurrently, return them in the original
// declared order so the merge step preserves override semantics.
const fetchFilesInOrder = async (baseUrl: string, files: readonly string[]): Promise<any[]> =>
    Promise.all(files.map(file => fetchConfigJson(joinUrl(baseUrl, file))));

export const loadGamedataWithMode = async <T = any>(url: string, mode: JsonMode, options: GamedataLoadOptions = {}): Promise<T> =>
{
    if(!url) throw new Error('loadGamedata: empty URL');

    if(!looksLikeDirectory(url))
    {
        return await fetchConfigJson<T>(url);
    }

    const idKeys = options.mergeArrayIdKeys ?? DEFAULT_ID_KEYS;
    const rootManifest = await tryFetchManifestPair<RootManifest>(url, 'manifest', mode);

    const tiers = (rootManifest?.tiers && rootManifest.tiers.length)
        ? rootManifest.tiers
        : (options.tiers ?? DEFAULT_TIERS);

    // Fetch root-level files in parallel with discovering each tier's
    // manifest. Per-tier file batches stay sequenced relative to each other
    // so override order (core → custom → seasonal) is preserved during
    // merge, but fetches inside a tier batch run concurrently.
    const [ rootParts, tierManifests ] = await Promise.all([
        rootManifest?.files?.length ? fetchFilesInOrder(url, rootManifest.files) : Promise.resolve([] as any[]),
        Promise.all(tiers.map(async tier =>
        {
            const tierUrl = joinUrl(url, `${ tier }/`);
            const manifest = await tryFetchManifestPair<TierManifest>(tierUrl, 'manifest', mode);

            return { tier, tierUrl, manifest };
        }))
    ]);

    let merged: any = undefined;

    for(const part of rootParts)
    {
        merged = (merged === undefined) ? part : mergeGamedata(merged, part, idKeys, url);
    }

    for(const { tier, tierUrl, manifest } of tierManifests)
    {
        if(!manifest?.files?.length) continue;

        const parts = await fetchFilesInOrder(tierUrl, manifest.files);

        for(const part of parts)
        {
            merged = (merged === undefined) ? part : mergeGamedata(merged, part, idKeys, `${ url } (${ tier })`);
        }
    }

    if(merged === undefined) throw new ConfigJsonError(`loadGamedata: directory mode at "${ url }" produced no data — make sure at least one tier has a manifest.jsonc or manifest.json with a "files" array`, 'fetch', url);

    return merged as T;
};

export const loadGamedata = async <T = any>(url: string, options: GamedataLoadOptions = {}): Promise<T> =>
    loadGamedataWithMode<T>(url, resolveJsonMode(), options);
