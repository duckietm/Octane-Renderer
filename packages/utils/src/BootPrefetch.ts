/**
 * Downloads a hotel page may start before the client script runs, so the renderer can use them instead of
 * asking again. Both stores are optional: without them (the default) every file is fetched as before.
 * Each entry is taken once; a later request for the same address fetches it fresh.
 *
 * - `window.__octanePrefetchCache`: address -> the pending `fetch()` of it.
 * - `window.__octanePrefetchData`: address -> a pending, already read result ({@link PrefetchedDataEntry}).
 *
 * Ported from plus-emulator/volt-renderer 1eacd0b5 (by Dennis, GPL-3.0).
 */

/** A download the page already read: the parsed json, its text or its bytes, with the HTTP status. */
export interface PrefetchedDataEntry
{
    ok: boolean;
    status: number;
    url?: string;
    contentType?: string;
    json?: unknown;
    text?: string;
    buffer?: ArrayBuffer;
}

interface PrefetchHolder
{
    __octanePrefetchCache?: Map<string, Promise<Response>>;
    __octanePrefetchData?: Map<string, Promise<PrefetchedDataEntry>>;
}

const takeFrom = <T>(store: Map<string, T> | undefined, url: string): T | null =>
{
    if(!url || !(store instanceof Map)) return null;

    const pending = store.get(url);

    if(pending === undefined) return null;

    store.delete(url);

    return pending;
};

/** The page's pending fetch of this address, taken out of its store; null when the page started none. */
export const takePrefetchedResponse = (url: string): Promise<Response> | null =>
    takeFrom((globalThis as PrefetchHolder).__octanePrefetchCache, url);

/** The page's already read download of this address, taken out of its store; null when the page has none. */
export const takePrefetchedData = (url: string): Promise<PrefetchedDataEntry> | null =>
    takeFrom((globalThis as PrefetchHolder).__octanePrefetchData, url);

/** The bytes the page already downloaded for this address, or null when it has none or its download failed. */
export const takePrefetchedBuffer = async (url: string): Promise<ArrayBuffer | null> =>
{
    const pending = takePrefetchedData(url);

    if(pending === null) return null;

    try
    {
        const entry = await pending;

        return (entry?.ok && entry.buffer && (typeof entry.buffer.byteLength === 'number')) ? entry.buffer : null;
    }
    catch
    {
        return null;
    }
};
