/** True for an absolute http(s) URL; anything else (javascript:, data:, local:, relative) is refused. */
export const isWebUrl = (url: string): boolean =>
{
    if(!url || (typeof url !== 'string')) return false;

    try
    {
        const protocol = new URL(url.trim()).protocol;

        return (protocol === 'http:') || (protocol === 'https:');
    }
    catch
    {
        return false;
    }
};

/**
 * Whether an image chosen by a user (billboards, room ads) may be loaded: http(s) or a path on this
 * site, and, when `allowedHosts` is not empty, only from one of those hosts or their subdomains.
 */
export const isAllowedUserImageUrl = (url: string, allowedHosts: string[] = [], location: string = globalThis.location?.href): boolean =>
{
    if(!url || (typeof url !== 'string')) return false;

    let parsed: URL;

    try
    {
        parsed = new URL(url.trim(), location);
    }
    catch
    {
        return false;
    }

    if((parsed.protocol !== 'http:') && (parsed.protocol !== 'https:')) return false;

    const hosts = allowedHosts.map(host => host.trim().toLowerCase()).filter(host => host.length);

    if(!hosts.length) return true;

    const host = parsed.hostname.toLowerCase();

    return hosts.some(allowed => (host === allowed) || host.endsWith('.' + allowed));
};

/** A comma separated or array config value as a list of hosts. */
export const parseHostList = (value: unknown): string[] =>
{
    if(Array.isArray(value)) return value.filter(entry => typeof entry === 'string');

    if(typeof value === 'string') return value.split(',');

    return [];
};

/**
 * Puts a value from the server into a URL template. The value is encoded, so `../`, `?` or `#` in a badge code cannot
 * change the path or the query, and it is inserted as written: a string replacement read `$&` and `$1` as patterns.
 */
export const fillUrlTemplate = (template: string, placeholder: string, value: string): string =>
    (template ?? '').replace(placeholder, () => encodeURIComponent(value ?? ''));
