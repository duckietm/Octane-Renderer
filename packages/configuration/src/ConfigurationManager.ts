import { NitroLogger, NitroVersion, parseConfigJsonFromResponse } from '@nitrots/utils';
import { IConfigurationManager } from './IConfigurationManager';

export class ConfigurationManager implements IConfigurationManager
{
    private _definitions: Map<string, unknown> = new Map();
    private _config: any = {};
    private _missingKeys: string[] = [];

    constructor()
    {
        NitroVersion.sayHello();
    }

    public async init(): Promise<void>
    {
        await this.reloadConfiguration();
    }

    public async reloadConfiguration(): Promise<void>
    {
        try
        {
            this.resetConfiguration();

            const defaultConfig = this.getDefaultConfig();

            if(!defaultConfig) throw new Error('Missing NitroConfig: make sure window.NitroConfig is defined in index.html');

            this.parseConfiguration(defaultConfig, true);

            const configurationUrls = this.getValue<string[]>('config.urls').slice();

            if(!configurationUrls || !configurationUrls.length) throw new Error('No config.urls defined in NitroConfig — expected an array like ["/renderer-config.json", "/ui-config.json"]');

            for(const url of configurationUrls)
            {
                if(!url || !url.length) return;

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

                this.parseConfiguration(json);
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

            return true;
        }

        catch (e)
        {
            NitroLogger.error(e.stack);

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

            NitroLogger.warn(`Missing configuration key: ${key}`);

            existing = value;
        }

        return (existing as T);
    }

    public setValue<T>(key: string, value: T): void
    {
        const parts = key.split('.');

        let last = this._config;

        for(let i = 0; i < parts.length; i++)
        {
            const part = parts[i].toString();

            if(i !== (parts.length - 1))
            {
                if(!last[part]) last[part] = {};

                last = last[part];

                continue;
            }

            last[part] = value;
        }

        this._definitions.set(key, value);
    }

    public getDefaultConfig(): { [index: string]: any }
    {
        return window.NitroConfig;
    }

    public get definitions(): Map<string, unknown>
    {
        return this._definitions;
    }
}
