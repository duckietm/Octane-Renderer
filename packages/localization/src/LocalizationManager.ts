import { ILocalizationManager } from '@octane/api';
import { BadgePointLimitsEvent, GetCommunication } from '@octane/communication';
import { GetConfiguration } from '@octane/configuration';
import { loadGamedata } from '@octane/utils';
import { BadgeBaseAndLevel } from './BadgeBaseAndLevel';

export class LocalizationManager implements ILocalizationManager
{
    /**
     * Configuration values a ${...} placeholder may show. Texts can come from the server (alerts, notifications), and
     * a placeholder there could otherwise print any configuration value, endpoints and keys included. More keys can be
     * listed in the configuration under localization.placeholder.configuration.keys.
     */
    public static readonly PLACEHOLDER_CONFIGURATION_KEYS: ReadonlySet<string> = new Set([ 'url.prefix', 'habbopages.url', 'image.library.url' ]);

    /**
     * Every "%name%" of a text is replaced, in any letter case, as the official Localization.fillParameterValues does
     * (RegExp "gim"), so a parameter used twice (the author of groupforum.view.forum_details) is filled everywhere.
     * The value is inserted as it is ("$" patterns are not expanded).
     */
    public static replaceParameter(value: string, parameter: string, replacement: string): string
    {
        if(!value || !parameter) return value;

        const pattern = new RegExp('%' + LocalizationManager.escapeRegExp(parameter) + '%', 'gi');

        return value.replace(pattern, () => replacement);
    }

    /** A parameter name as a literal inside a pattern: a name with a pattern character used to change or break it. */
    public static escapeRegExp(text: string): string
    {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Texts set at run time (setValue); they win over the text files.
    private _definitions: Map<string, string> = new Map();
    // The parsed text files, in load order; a key is read from them (and kept in the cache) on its first lookup.
    private _baseDocuments: { [index: string]: unknown }[] = [];
    private _baseCache: Map<string, string> = new Map();
    private _furnitureResolver: ((key: string) => string | null) | null = null;
    private _overrideDefinitions: Map<string, string> = new Map();
    private _parameters: Map<string, Map<string, string>> = new Map();
    private _badgePointLimits: Map<string, number> = new Map();
    private _romanNumerals: string[] = [ 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX' ];

    public async init(): Promise<void>
    {
        try
        {
            const urls = GetConfiguration().getValue<string[]>('external.texts.url').slice();

            if(!urls || !urls.length) throw new Error('Missing "external.texts.url" in config — add the localization URL to your ui-config.json');

            const firstEmptyUrl = urls.findIndex(url => !url || !url.length);
            const textUrls = ((firstEmptyUrl >= 0) ? urls.slice(0, firstEmptyUrl) : urls).map(url => GetConfiguration().interpolate(url));

            // Downloaded together, applied in order so later files still override earlier ones.
            const documents = await Promise.all(textUrls.map(async url =>
            {
                try
                {
                    return await loadGamedata(url);
                }
                catch (err)
                {
                    throw new Error(`Could not load localization file "${ url }" — check "external.texts.url" in ui-config.json (${ err?.message || err })`);
                }
            }));

            // A new load replaces the text files of an earlier one.
            this._baseDocuments = [];
            this._baseCache.clear();

            for(const data of documents) this.parseLocalization(data);

            GetCommunication().registerMessageEvent(new BadgePointLimitsEvent(this.onBadgePointLimitsEvent.bind(this)));
        }

        catch (err)
        {
            throw new Error(err.message || String(err));
        }
    }

    private parseLocalization(data: { [index: string]: any }): boolean
    {
        if(!data) return false;

        // Kept as parsed: copying tens of thousands of keys into a map is boot time spent on texts never shown.
        this._baseDocuments.push(data);
        this._baseCache.clear();

        return true;
    }

    /** Like AIR's CoreLocalizationManager, a backslash followed by "n" in a text file is a line break. */
    private static decodeValue(value: unknown): unknown
    {
        return ((typeof value === 'string') && value.includes('\\n')) ? value.replace(/\\n/g, '\n') : value;
    }

    /** A key of the text files; a later file wins over an earlier one. */
    private lookupBaseDefinition(key: string): string | undefined
    {
        if(this._baseCache.has(key)) return this._baseCache.get(key);

        for(let i = this._baseDocuments.length - 1; i >= 0; i--)
        {
            const document = this._baseDocuments[i];

            if(!Object.prototype.hasOwnProperty.call(document, key)) continue;

            const value = LocalizationManager.decodeValue(document[key]) as string;

            this._baseCache.set(key, value);

            return value;
        }

        return undefined;
    }

    public setFurnitureResolver(resolver: ((key: string) => string | null) | null): void
    {
        this._furnitureResolver = resolver;
    }

    /** A furniture name or description (roomItem.* / wallItem.*) from the furniture data, when a resolver is set. */
    private resolveFurnitureValue(key: string): string | null
    {
        if(!this._furnitureResolver) return null;

        if(!key.startsWith('roomItem.') && !key.startsWith('wallItem.')) return null;

        const value = this._furnitureResolver(key);

        // As raw as the furniture data has it, like the texts the furniture data used to copy in with setValue.
        return ((value === null) || (value === undefined)) ? null : value;
    }

    private onBadgePointLimitsEvent(event: BadgePointLimitsEvent): void
    {
        const parser = event.getParser();

        for(const data of parser.data) this.setBadgePointLimit(data.badgeId, data.limit);
    }

    public getBadgePointLimit(badge: string): number
    {
        return (this._badgePointLimits.get(badge) || -1);
    }

    public setBadgePointLimit(badge: string, point: number): void
    {
        this._badgePointLimits.set(badge, point);
    }

    public getRomanNumeral(number: number): string
    {
        return this._romanNumerals[Math.max(0, (number - 1))];
    }

    public getPreviousLevelBadgeId(badgeName: string): string
    {
        const badge = new BadgeBaseAndLevel(badgeName);

        badge.level--;

        return badge.getBadgeId;
    }

    public hasValue(key: string): boolean
    {
        return (this._overrideDefinitions.has(key) || (this.resolveFurnitureValue(key) !== null) || this._definitions.has(key) || (this.lookupBaseDefinition(key) !== undefined));
    }

    public getValue(key: string, doParams: boolean = true): string
    {
        return this.resolveValue(key, doParams, false);
    }

    private resolveValue(key: string, doParams: boolean, placeholder: boolean): string
    {
        if(!key || !key.length) return null;

        const keys = key.match(/\$\{.[^}]*\}/g);

        if(keys && keys.length)
        {
            for(const splitKey of keys) key = key.replace(splitKey, this.resolveValue(splitKey.slice(2, -1), doParams, true));
        }

        // A furniture text comes from the furniture data while it knows the item, so it never goes stale;
        // what setValue stored for one is only kept for items it does not know.
        let value = (this._overrideDefinitions.get(key) || this.resolveFurnitureValue(key) || this._definitions.get(key) || this.lookupBaseDefinition(key) || null);

        if(!value)
        {
            if(placeholder && !LocalizationManager.isPlaceholderConfigurationKey(key)) return key;

            const configured = GetConfiguration().definitions.get(key);

            // A configuration value can be a number, a list or an object; a text is always a string.
            if(configured && (typeof configured !== 'object')) return String(configured);
        }

        // A text can point at another text, as Habbo's external texts do ("widget.areahide.area_selection" is
        // "${wiredfurni.params.area_selection}"); AIR follows those links, so fill each one it knows.
        if(value && (value.indexOf('${') >= 0)) value = this.resolveReferences(value, 0);

        if(value && doParams)
        {
            const parameters = this._parameters.get(key);

            if(parameters)
            {
                for(const [parameter, replacement] of parameters)
                {
                    value = LocalizationManager.replaceParameter(value, parameter, replacement);
                }
            }
        }

        return (value || key);
    }

    private static readonly MAX_REFERENCE_DEPTH = 8;

    // Replaces each ${key} in a text value by that key's text; a key that has no text, or a loop deeper
    // than MAX_REFERENCE_DEPTH, stays as written.
    private resolveReferences(value: string, depth: number): string
    {
        if(depth >= LocalizationManager.MAX_REFERENCE_DEPTH) return value;

        return value.replace(/\$\{([^}]+)\}/g, (match: string, key: string) =>
        {
            let text = (this._overrideDefinitions.get(key) || this.resolveFurnitureValue(key) || this._definitions.get(key) || this.lookupBaseDefinition(key) || null);

            if(!text && LocalizationManager.isPlaceholderConfigurationKey(key))
            {
                const configured = GetConfiguration().definitions.get(key);

                if(configured !== undefined && configured !== null && (typeof configured !== 'object')) text = String(configured);
            }

            if(!text) return match;

            return (text.indexOf('${') >= 0) ? this.resolveReferences(text, depth + 1) : text;
        });
    }

    private static isPlaceholderConfigurationKey(key: string): boolean
    {
        if(LocalizationManager.PLACEHOLDER_CONFIGURATION_KEYS.has(key)) return true;

        const extra = GetConfiguration().getValue<string[]>('localization.placeholder.configuration.keys', []);

        return Array.isArray(extra) && extra.includes(key);
    }

    public getValueWithParameter(key: string, parameter: string, replacement: string): string
    {
        const value = this.getValue(key, false);

        const replacedValue = LocalizationManager.replaceParameter(value, parameter, replacement);

        if(value.startsWith('%{'))
        {
            // This adds support for multi-optioned texts like
            // catalog.vip.item.header.months=%{NUM_MONTHS|0 months|1 month|%% months}
            // It only checks for this multi-optioned thext if the value of the key starts with %{

            // If it does, it will create a RegEx with the provided parameter, eg. NUM_DAYS or NUM_MONTS
            // Then, based on the provided replacement it searches for the resultgroup based on the replacement.
            // If the replacement is not either 0, 1 - it will be assumed it will be plural. (eg. Months)
            const regex = new RegExp('%{' + LocalizationManager.escapeRegExp(parameter.toUpperCase()) + '\\|([^|]*)\\|([^|]*)\\|([^|]*)}');
            const result = value.match(regex);

            if(!result) return replacedValue;

            let indexKey = -1;
            const replacementAsNumber = Number.parseInt(replacement);
            let replace = false;

            switch(replacementAsNumber)
            {
                case 0:
                    indexKey = 1;
                    break;
                case 1:
                    indexKey = 2;
                    break;
                default:
                case 2:
                    indexKey = 3;
                    replace = true;
                    break;
            }


            if(indexKey == -1 || typeof result[indexKey] == 'undefined')
            {
                return replacedValue;
            }

            const valueFromResults = result[indexKey];

            if(valueFromResults)
            {
                return valueFromResults.replace('%%', replacement);
            }
        }

        return replacedValue;
    }

    public getValueWithParameters(key: string, parameters: string[], replacements: string[]): string
    {
        let value = this.getValue(key, false);

        if(parameters)
        {
            for(let i = 0; i < parameters.length; i++)
            {
                const parameter = parameters[i];
                const replacement = replacements[i];

                if(replacement === undefined) continue;

                value = LocalizationManager.replaceParameter(value, parameter, replacement);

                if(value.startsWith('%{'))
                {
                    const regex = new RegExp('%{' + LocalizationManager.escapeRegExp(parameter.toUpperCase()) + '\\|([^|]*)\\|([^|]*)\\|([^|]*)}');
                    const result = value.match(regex);

                    if(!result) continue;

                    const replacementAsNumber = parseInt(replacement);

                    let indexKey = -1;
                    let replace = false;

                    switch(replacementAsNumber)
                    {
                        case 0:
                            indexKey = 1;
                            break;
                        case 1:
                            indexKey = 2;
                            break;
                        case 2:
                        default:
                            indexKey = 3;
                            replace = true;
                            break;
                    }


                    if((indexKey === -1) || (typeof result[indexKey] === 'undefined')) continue;

                    const valueFromResults = result[indexKey];

                    if(valueFromResults)
                    {
                        value = valueFromResults.replace('%%', replacement);
                    }
                }
            }
        }

        return value;
    }

    public setValue(key: string, value: string): void
    {
        this._definitions.set(key, value);
    }

    public setOverrideValues(values: Map<string, string>): void
    {
        this._overrideDefinitions = (values || new Map());
    }

    public clearOverrideValues(): void
    {
        this._overrideDefinitions.clear();
    }

    public registerParameter(key: string, parameter: string, value: string): void
    {
        if(!key || (key.length === 0) || !parameter || (parameter.length === 0)) return;

        let existing = this._parameters.get(key);

        if(!existing)
        {
            existing = new Map();

            this._parameters.set(key, existing);
        }

        existing.set(parameter, value);
    }

    public getBadgeName(key: string): string
    {
        const badge = new BadgeBaseAndLevel(key);
        const keys = ['badge_name_' + key, 'badge_name_' + badge.base];

        let name = this.fixBadLocalization(this.getExistingKey(keys));

        name = name.replace('%roman%', this.getRomanNumeral(badge.level));

        return name;
    }

    public getBadgeDesc(key: string): string
    {
        const badge = new BadgeBaseAndLevel(key);
        const keys = ['badge_desc_' + key, 'badge_desc_' + badge.base];

        let desc = this.fixBadLocalization(this.getExistingKey(keys));

        const limit = this.getBadgePointLimit(key);

        if(limit > -1) desc = desc.replace('%limit%', limit.toString());

        desc = desc.replace('%roman%', this.getRomanNumeral(badge.level));

        return desc;
    }

    private getExistingKey(keys: string[]): string
    {
        for(const entry of keys)
        {
            const item = this.getValue(entry);
            if(item != entry) return item;
        }

        return '';
    }

    private fixBadLocalization(value: string): string
    {
        return value.replace('${', '$')
            .replace('{', '$')
            .replace('}', '$');
    }
}