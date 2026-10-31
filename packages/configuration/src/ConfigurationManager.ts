import { LegacyExternalInterface, OctaneLogger, OctaneVersion, parseConfigJsonFromResponse } from '@octane/utils';
import { IConfigurationManager } from './IConfigurationManager';

const UNSAFE_KEY_PARTS = new Set([ '__proto__', 'constructor', 'prototype' ]);

export class ConfigurationManager implements IConfigurationManager
{
    private _definitions: Map<string, unknown> = new Map();
    private _config: any = {};
    private _missingKeys: string[] = [];
    private _initialLoad: Promise<void> = null;

    constructor()
    {
        OctaneVersion.sayHello();
    }

    /** Loads the configuration once; later calls share that load. A failed load is retried on the next call. */
    public init(): Promise<void>
    {
        if(!this._initialLoad)
        {
            this._initialLoad = this.reloadConfiguration().catch(error =>
            {
                this._initialLoad = null;

                throw error;
            });
        }

        return this._initialLoad;
    }

    public async reloadConfiguration(): Promise<void>
    {
        try
        {
            const defaultConfig = this.getDefaultConfig();

            if(!defaultConfig) throw new Error('Missing OctaneConfig: make sure window.OctaneConfig is defined in index.html');

            this.parseConfiguration(defaultConfig, true);

            // Read before the check: a missing key returned null and .slice() threw before the message below.
            const configurationUrls = (this.getValue<string[]>('config.urls') ?? []).slice();

            if(!configurationUrls || !configurationUrls.length) throw new Error('No config.urls defined in OctaneConfig — expected an array like ["/renderer-config.json", "/ui-config.json"]');

            const firstEmptyUrl = configurationUrls.findIndex(url => !url || !url.length);
            const urls = (firstEmptyUrl >= 0) ? configurationUrls.slice(0, firstEmptyUrl) : configurationUrls;

            // Fetched together; later documents still override earlier ones below.
            const documents: any[] = await Promise.all(urls.map(async url =>
            {
                let response: Response;

                try
                {
                    response = await fetch(url);
                }
                catch (fetchError)
                {
                    throw new Error(`Failed to fetch config "${ url }" — check that the file exists and the server is reachable (${ fetchError.message })`);
                }

                if(response.status !== 200) throw new Error(`Failed to load config "${ url }" — server returned HTTP ${ response.status }`);

                let json: any;

                try
                {
                    json = await parseConfigJsonFromResponse(response, url);
                }
                catch (parseError)
                {
                    throw new Error(`Invalid config "${ url }" — JSON/JSONC parse failed. JSONC allows comments and trailing commas (${ parseError.message })`);
                }

                return json;
            }));

            this.resetConfiguration();
            this.parseConfiguration(defaultConfig, true);

            for(const json of documents) this.parseConfiguration(json);

            // The page that may embed the client: messages to the parent window go only there.
            const parentOrigin = this._definitions.get('legacy.parent.origin');

            LegacyExternalInterface.setParentOrigin(typeof parentOrigin === 'string' ? parentOrigin : null);

            // With system.log.debug on: which files were read and how big, so a key reported missing is easy to trace
            // to a stale or wrong file. Plain console, as OctaneLogger's switches are only applied after this load.
            if(this._definitions.get('system.log.debug') === true)
            {
                urls.forEach((url, index) =>
                {
                    const json = documents[index];

                    console.info(`[Configuration] ${ url.split('?')[0] }: ${ json && typeof json === 'object' ? Object.keys(json).length : 0 } keys`);
                });
            }
        }

        catch (err)
        {
            throw new Error(err.message || String(err));
        }
    }

    public resetConfiguration(): void
    {
        this._definitions.clear();
        this._config = {};
        this._missingKeys = [];
    }

    public parseConfiguration(data: { [index: string]: any }, overrides: boolean = false): boolean
    {
        if(!data) return false;

        try
        {
            const regex = new RegExp(/\${(.*?)}/g);

            for(const key in data)
            {
                // One bad key must not drop every key after it in the file.
                try
                {
                    let value = data[key];

                    if(typeof value === 'string') value = this.interpolate(value, regex);

                    if(this._definitions.has(key))
                    {
                        if(overrides) this.setValue(key, value);
                    }
                    else
                    {
                        this.setValue(key, value);
                    }
                }

                catch (e)
                {
                    // Plain console: the log switches come from these files and may still be off.
                    console.error(`[Configuration] could not read "${ key }"`, e);
                }
            }

            return true;
        }

        catch (e)
        {
            OctaneLogger.error(e.stack);

            return false;
        }
    }

    public interpolate(value: string, regex: RegExp = null): string
    {
        if(!regex) regex = new RegExp(/\${(.*?)}/g);

        const pieces = value.match(regex);

        if(pieces && pieces.length)
        {
            for(const piece of pieces)
            {
                const existing = (this._definitions.get(this.removeInterpolateKey(piece)) as string);

                if(existing) (value = value.replace(piece, existing));
            }
        }

        if(value.indexOf('%timestamp%') >= 0)
        {
            value = value.replace(/%timestamp%/gi, Date.now().toString());
        }

        return value;
    }

    private removeInterpolateKey(value: string): string
    {
        return value.replace('${', '').replace('}', '');
    }

    public getValue<T>(key: string, value: T = null): T
    {
        let existing = this._definitions.get(key);

        if(existing === undefined)
        {
            if(this._missingKeys.indexOf(key) >= 0) return value;

            this._missingKeys.push(key);

            OctaneLogger.warn(`Missing configuration key: ${key}`);

            existing = value;
        }

        return (existing as T);
    }

    public setValue<T>(key: string, value: T): void
    {
        const parts = key.split('.');

        // A key such as "__proto__.x" walked into Object.prototype and set the value for every object in the page.
        if(parts.some(part => UNSAFE_KEY_PARTS.has(part))) return;

        let last = this._config;

        for(let i = 0; i < parts.length; i++)
        {
            const part = parts[i].toString();

            if(i !== (parts.length - 1))
            {
                // "loader" and "loader.waiting" can both be keys: a plain value cannot hold the nested
                // part, so it is replaced in the tree (the flat definitions keep both).
                if(!last[part] || (typeof last[part] !== 'object')) last[part] = {};

                last = last[part];

                continue;
            }

            last[part] = value;
        }

        this._definitions.set(key, value);
    }

    public getDefaultConfig(): { [index: string]: any }
    {
        return window.OctaneConfig;
    }

    public get definitions(): Map<string, unknown>
    {
        return this._definitions;
    }
}
