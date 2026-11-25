import { afterEach, describe, expect, it, vi } from 'vitest';
import { PrefetchedDataEntry, takePrefetchedBuffer, takePrefetchedData, takePrefetchedResponse } from '../BootPrefetch';
import { ConfigJsonError, fetchConfigJson } from '../JsonParser';

type Holder = {
    __octanePrefetchCache?: Map<string, Promise<Response>>;
    __octanePrefetchData?: Map<string, Promise<PrefetchedDataEntry>>;
};

const holder = globalThis as Holder;

const prefetchData = (url: string, entry: PrefetchedDataEntry | Error): void =>
{
    holder.__octanePrefetchData ??= new Map();
    holder.__octanePrefetchData.set(url, (entry instanceof Error) ? Promise.reject(entry) : Promise.resolve(entry));
};

const jsonResponse = (body: string, status: number = 200) => new Response(body, { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() =>
{
    delete holder.__octanePrefetchCache;
    delete holder.__octanePrefetchData;
    vi.unstubAllGlobals();
});

describe('BootPrefetch', () =>
{
    it('finds nothing when the page prefetched nothing', async () =>
    {
        expect(takePrefetchedResponse('https://cdn.example/a.json')).toBeNull();
        expect(takePrefetchedData('https://cdn.example/a.json')).toBeNull();
        await expect(takePrefetchedBuffer('https://cdn.example/a.nitro')).resolves.toBeNull();
    });

    it('hands out each prefetched download once', async () =>
    {
        const response = Promise.resolve(jsonResponse('{}'));

        holder.__octanePrefetchCache = new Map([ [ 'https://cdn.example/a.json', response ] ]);

        expect(takePrefetchedResponse('https://cdn.example/a.json')).toBe(response);
        expect(takePrefetchedResponse('https://cdn.example/a.json')).toBeNull();
    });

    it('gives the bytes of a successful download, and none for a failed one', async () =>
    {
        const buffer = new Uint8Array([ 1, 2, 3 ]).buffer;

        prefetchData('https://cdn.example/ok.nitro', { ok: true, status: 200, buffer });
        prefetchData('https://cdn.example/missing.nitro', { ok: false, status: 404 });
        prefetchData('https://cdn.example/broken.nitro', new Error('network'));

        await expect(takePrefetchedBuffer('https://cdn.example/ok.nitro')).resolves.toBe(buffer);
        await expect(takePrefetchedBuffer('https://cdn.example/missing.nitro')).resolves.toBeNull();
        await expect(takePrefetchedBuffer('https://cdn.example/broken.nitro')).resolves.toBeNull();
    });
});

describe('fetchConfigJson with prefetched data', () =>
{
    it('uses json the page already parsed, without fetching', async () =>
    {
        const fetch = vi.fn();

        vi.stubGlobal('fetch', fetch);
        prefetchData('https://cdn.example/furnidata.json', { ok: true, status: 200, json: { value: 1 } });

        await expect(fetchConfigJson('https://cdn.example/furnidata.json')).resolves.toEqual({ value: 1 });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('parses prefetched text by the same rules as a fetched file', async () =>
    {
        vi.stubGlobal('fetch', vi.fn());
        prefetchData('https://cdn.example/texts.jsonc', { ok: true, status: 200, text: '{ // note\n "a": 1, }' });
        prefetchData('https://cdn.example/typed', { ok: true, status: 200, contentType: 'application/jsonc', text: '{ "b": 2, }' });

        await expect(fetchConfigJson('https://cdn.example/texts.jsonc')).resolves.toEqual({ a: 1 });
        await expect(fetchConfigJson('https://cdn.example/typed')).resolves.toEqual({ b: 2 });
    });

    it('refuses prefetched JSON5 like a fetched one', async () =>
    {
        prefetchData('https://cdn.example/a', { ok: true, status: 200, contentType: 'application/json5', text: '{}' });

        await expect(fetchConfigJson('https://cdn.example/a')).rejects.toBeInstanceOf(ConfigJsonError);
    });

    it('fetches again when the early download failed or was not a 200', async () =>
    {
        const fetch = vi.fn().mockImplementation(async () => jsonResponse('{"live":true}'));

        vi.stubGlobal('fetch', fetch);
        prefetchData('https://cdn.example/a.json', { ok: false, status: 503 });
        prefetchData('https://cdn.example/b.json', new Error('offline'));

        await expect(fetchConfigJson('https://cdn.example/a.json')).resolves.toEqual({ live: true });
        await expect(fetchConfigJson('https://cdn.example/b.json')).resolves.toEqual({ live: true });
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('reads a prefetched response with the usual status check', async () =>
    {
        const fetch = vi.fn();

        vi.stubGlobal('fetch', fetch);
        holder.__octanePrefetchCache = new Map([
            [ 'https://cdn.example/a.json', Promise.resolve(jsonResponse('{"early":true}')) ],
            [ 'https://cdn.example/b.json', Promise.resolve(jsonResponse('{}', 404)) ]
        ]);

        await expect(fetchConfigJson('https://cdn.example/a.json')).resolves.toEqual({ early: true });
        await expect(fetchConfigJson('https://cdn.example/b.json')).rejects.toMatchObject({ phase: 'fetch', httpStatus: 404 });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('leaves a request with its own options to fetch', async () =>
    {
        const fetch = vi.fn().mockImplementation(async () => jsonResponse('{"live":true}'));

        vi.stubGlobal('fetch', fetch);
        prefetchData('https://cdn.example/a.json', { ok: true, status: 200, json: { early: true } });

        await expect(fetchConfigJson('https://cdn.example/a.json', { cache: 'no-store' })).resolves.toEqual({ live: true });
        expect(fetch).toHaveBeenCalledOnce();
    });
});
