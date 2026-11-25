import { afterEach, describe, expect, it, vi } from 'vitest';

// The default decoder needs a real browser; the point here is which requests the default fetch makes.
vi.mock('./StaticImageDecoder', () => ({ decodeStaticImage: vi.fn(async () => ({ kind: 'static' })) }));

const { loadImageResource } = await import('./ImageLoader');
const { decodeStaticImage } = await import('./StaticImageDecoder');

const PNG_SIGNATURE = [ 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a ];
const pngResponse = () => new Response(new Uint8Array(PNG_SIGNATURE), { status: 200, headers: { 'Content-Type': 'image/png' } });

type Holder = { __octanePrefetchCache?: Map<string, Promise<Response>> };

afterEach(() =>
{
    delete (globalThis as Holder).__octanePrefetchCache;
    vi.unstubAllGlobals();
    vi.mocked(decodeStaticImage).mockClear();
});

describe('loadImageResource with the browser fetch', () =>
{
    it('reads an inlined base64 image in place instead of fetching it', async () =>
    {
        const fetch = vi.fn();
        const source = 'data:image/png;base64,' + btoa(String.fromCharCode(...PNG_SIGNATURE));

        vi.stubGlobal('fetch', fetch);

        await expect(loadImageResource({ source })).resolves.toEqual({ kind: 'static' });

        expect(fetch).not.toHaveBeenCalled();
        expect(Array.from(vi.mocked(decodeStaticImage).mock.calls[0][0])).toEqual(PNG_SIGNATURE);
    });

    it('uses the page\'s early request for an image once, then fetches', async () =>
    {
        const fetch = vi.fn(async () => pngResponse());
        const source = 'https://cdn.example/icon.png';

        vi.stubGlobal('fetch', fetch);
        (globalThis as Holder).__octanePrefetchCache = new Map([ [ source, Promise.resolve(pngResponse()) ] ]);

        await loadImageResource({ source });
        expect(fetch).not.toHaveBeenCalled();

        await loadImageResource({ source });
        expect(fetch).toHaveBeenCalledOnce();
    });
});
