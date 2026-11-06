import { afterEach, describe, expect, it, vi } from 'vitest';
import { HabbiconAssetManager } from './HabbiconAssetManager';

type Internals = {
    getBaseUrl: () => string;
    loadImage: (url: string) => Promise<HTMLImageElement>;
};

const manifest = { habbicons: [ { id: 7, name: 'duck', width: 40, height: 40 } ], collectionIcons: [] as unknown[] };

const freshManager = () =>
{
    const manager = new (HabbiconAssetManager as unknown as { new(): HabbiconAssetManager })();
    const internals = manager as unknown as Internals;

    vi.spyOn(internals, 'getBaseUrl').mockReturnValue('https://cdn.example/habbicons/');
    vi.spyOn(internals, 'loadImage').mockResolvedValue({} as HTMLImageElement);

    return manager;
};

describe('HabbiconAssetManager manifest', () =>
{
    afterEach(() =>
    {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('tries a failed manifest again after a pause', async () =>
    {
        const fetchManifest = vi.fn()
            .mockResolvedValueOnce({ ok: false })
            .mockResolvedValueOnce({ ok: true, json: async () => manifest });
        let now = 1_000;

        vi.stubGlobal('fetch', fetchManifest);
        vi.spyOn(Date, 'now').mockImplementation(() => now);

        const manager = freshManager();

        await manager.preload();
        expect(manager.getNameKey(7)).toBe('');

        // Within the pause the failure is not retried on every bubble.
        await manager.preload();
        expect(fetchManifest).toHaveBeenCalledTimes(1);

        // The first failure used to stay cached until the page was reloaded.
        now += 30_000;
        await manager.preload();
        expect(fetchManifest).toHaveBeenCalledTimes(2);
        expect(manager.getNameKey(7)).toBe('duck');
    });

    it('loads a good manifest once', async () =>
    {
        const fetchManifest = vi.fn().mockResolvedValue({ ok: true, json: async () => manifest });

        vi.stubGlobal('fetch', fetchManifest);

        const manager = freshManager();

        await manager.preload();
        await manager.preload();

        expect(fetchManifest).toHaveBeenCalledTimes(1);
    });
});
