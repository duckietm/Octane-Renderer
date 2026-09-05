import stripJsonComments from 'strip-json-comments';

declare const __OCTANE_JSON_MODE__: 'legacy' | 'jsonc' | 'auto' | undefined;

const JSONC_EXTENSION = /\.jsonc(?:[?#]|$)/i;
const JSONC_MIME = /(?:application|text)\/(?:jsonc|x-jsonc)/i;
const JSON5_EXTENSION = /\.json5(?:[?#]|$)/i;
const JSON5_MIME = /(?:application|text)\/(?:json5|x-json5)/i;

export type JsonMode = 'legacy' | 'jsonc' | 'auto';
export type ConfigJsonErrorPhase = 'fetch' | 'parse';

export class ConfigJsonError extends Error
{
    public readonly phase: ConfigJsonErrorPhase;
    public readonly sourceUrl: string;
    public readonly httpStatus?: number;

    constructor(message: string, phase: ConfigJsonErrorPhase, sourceUrl: string, httpStatus?: number, cause?: unknown)
    {
        super(message);
        this.name = 'ConfigJsonError';
        this.phase = phase;
        this.sourceUrl = sourceUrl;
        this.httpStatus = httpStatus;
        if(cause !== undefined) (this as any).cause = cause;
    }
}

export const isMissingResource = (err: unknown): boolean =>
    err instanceof ConfigJsonError && err.phase === 'fetch' && err.httpStatus === 404;

export const resolveJsonMode = (): JsonMode =>
{
    try
    {
        if(typeof __OCTANE_JSON_MODE__ !== 'undefined' && __OCTANE_JSON_MODE__)
        {
            if(__OCTANE_JSON_MODE__ === 'legacy' || __OCTANE_JSON_MODE__ === 'jsonc' || __OCTANE_JSON_MODE__ === 'auto') return __OCTANE_JSON_MODE__;
        }
    }
    catch
    {}

    return 'auto';
};

const sourceSuffix = (sourceUrl: string): string => sourceUrl ? ` in "${ sourceUrl }"` : '';

const errorMessage = (error: unknown): string => (error as Error)?.message || String(error);

const rejectJson5Source = (sourceUrl: string): void =>
{
    if(!sourceUrl || !JSON5_EXTENSION.test(sourceUrl)) return;

    throw new ConfigJsonError(
        `Unsupported JSON5 resource${ sourceSuffix(sourceUrl) } — rename and convert it to JSONC`,
        'parse',
        sourceUrl
    );
};

const parseStrict = <T>(text: string, sourceUrl: string): T =>
{
    try
    {
        return JSON.parse(text) as T;
    }
    catch (error)
    {
        throw new ConfigJsonError(
            `Failed to parse strict JSON${ sourceSuffix(sourceUrl) } — ${ errorMessage(error) } (use JSONC mode for comments or trailing commas)`,
            'parse',
            sourceUrl,
            undefined,
            error
        );
    }
};

const parseJsonc = <T>(text: string): T =>
    JSON.parse(stripJsonComments(text, { trailingCommas: true })) as T;

const parseJsoncWithError = <T>(text: string, sourceUrl: string): T =>
{
    try
    {
        return parseJsonc<T>(text);
    }
    catch (error)
    {
        throw new ConfigJsonError(
            `Failed to parse JSONC${ sourceSuffix(sourceUrl) } — ${ errorMessage(error) }`,
            'parse',
            sourceUrl,
            undefined,
            error
        );
    }
};

export const parseConfigJsonWithMode = <T = any>(text: string, mode: JsonMode, sourceUrl: string = ''): T =>
{
    rejectJson5Source(sourceUrl);

    if(JSONC_EXTENSION.test(sourceUrl)) return parseJsoncWithError<T>(text, sourceUrl);
    if(mode === 'legacy') return parseStrict<T>(text, sourceUrl);
    if(mode === 'jsonc') return parseJsoncWithError<T>(text, sourceUrl);

    let strictError: unknown;

    try
    {
        return JSON.parse(text) as T;
    }
    catch (error)
    {
        strictError = error;
    }

    try
    {
        return parseJsonc<T>(text);
    }
    catch (jsoncError)
    {
        throw new ConfigJsonError(
            `Failed to parse JSON/JSONC${ sourceSuffix(sourceUrl) } — JSONC: ${ errorMessage(jsoncError) } (strict JSON: ${ errorMessage(strictError) })`,
            'parse',
            sourceUrl,
            undefined,
            jsoncError
        );
    }
};

export const parseConfigJson = <T = any>(text: string, sourceUrl: string = ''): T =>
    parseConfigJsonWithMode<T>(text, resolveJsonMode(), sourceUrl);

export const parseConfigJsonFromResponse = async <T = any>(response: Response, sourceUrl: string = ''): Promise<T> =>
{
    const contentType = response.headers?.get?.('content-type') || '';
    const text = await response.text();
    const url = sourceUrl || (response as any).url || '';

    if(JSON5_MIME.test(contentType))
    {
        throw new ConfigJsonError(
            `Unsupported JSON5 content type for "${ url }" — serve JSON or JSONC instead`,
            'parse',
            url
        );
    }

    if(JSONC_MIME.test(contentType))
    {
        rejectJson5Source(url);
        return parseJsoncWithError<T>(text, url);
    }

    return parseConfigJson<T>(text, url);
};

export const fetchConfigJson = async <T = any>(url: string, init?: RequestInit): Promise<T> =>
{
    let response: Response | undefined;

    try
    {
        response = await fetch(url, init);
    }
    catch (networkError)
    {
        throw new ConfigJsonError(
            `Network error fetching "${ url }" — ${ errorMessage(networkError) }`,
            'fetch',
            url,
            undefined,
            networkError
        );
    }

    if(!response || response.status !== 200)
    {
        const status = response?.status;
        throw new ConfigJsonError(
            `Failed to fetch "${ url }" — server returned HTTP ${ status ?? 'no response' }`,
            'fetch',
            url,
            status
        );
    }

    return parseConfigJsonFromResponse<T>(response, url);
};
