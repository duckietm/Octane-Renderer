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

/** The hosts a furni photo or video thumbnail may load from over https when the hotel lists none. */
export const DEFAULT_FURNI_IMAGE_HOSTS = ['youtube.com', 'ytimg.com'];

/**
 * Whether a furni photo or thumbnail URL may be loaded. The URL is written by users into the furni data, and loading
 * it from any host showed the IP of everyone entering the room to that host. Allowed: this site, the sites of the
 * hotel's own configured URLs (`trustedUrls`, such as the camera), and https from a listed host or its subdomains.
 */
export const isAllowedFurniImageUrl = (url: string, allowedHosts: string[], trustedUrls: string[] = [], location: string = globalThis.location?.href): boolean =>
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

    const origins: string[] = [];

    for(const trusted of [location, ...trustedUrls])
    {
        try
        {
            if(trusted) origins.push(new URL(trusted, location).origin);
        }
        catch
        {
            // A broken configured URL trusts nothing.
        }
    }

    if(origins.includes(parsed.origin)) return true;

    if(parsed.protocol !== 'https:') return false;

    const host = parsed.hostname.toLowerCase();

    return allowedHosts
        .map(allowed => allowed.trim().toLowerCase())
        .filter(allowed => allowed.length)
        .some(allowed => (host === allowed) || host.endsWith('.' + allowed));
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
