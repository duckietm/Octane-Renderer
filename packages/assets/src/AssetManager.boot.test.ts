import { Texture } from 'pixi.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssetManager, AssetManagerDependencies } from './AssetManager';
import { GraphicAssetCollection } from './GraphicAssetCollection';

const BUNDLE_URL = 'https://cdn.example/chair.nitro';

type Holder = {
    __octanePrefetchCache?: Map<string, Promise<Response>>;
    __octanePrefetchData?: Map<string, Promise<{ ok: boolean; status: number; buffer?: ArrayBuffer }>>;
};

const holder = globalThis as Holder;

const createResource = () => ({ texture: new Texture(), format: 'png' as const, animated: false, dispose: vi.fn() });

/** The manager with the browser's own fetch (the only one that may use what the page prefetched), the rest mocked. */
const createManager = (overrides: Partial<AssetManagerDependencies> = {}) =>
{
    const defaults = (new AssetManager() as unknown as { _dependencies: AssetManagerDependencies })._dependencies;
    const dependencies: AssetManagerDependencies = {
        ...defaults,
        wait: vi.fn().mockResolvedValue(undefined),
        parseAssetData: vi.fn(),
        loadImageResource: vi.fn().mockImplementation(async () => createResource()),
        loadOctaneBundle: vi.fn().mockImplementation(async (_buffer, decodeTexture) => ({
            texture: await decodeTexture(new ArrayBuffer(8), 'chair.png'),
            jsonFile: { name: 'chair' }
        })),
        ...overrides
    };
    const manager = new AssetManager(dependencies);

    vi.spyOn(manager as unknown as { processAsset(texture: unknown, data: unknown): Promise<unknown> }, 'processAsset').mockResolvedValue(null);

    return { manager, dependencies };
};

afterEach(() =>
{
    delete holder.__octanePrefetchCache;
    delete holder.__octanePrefetchData;
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('AssetManager boot downloads', () =>
{
    it('reads a bundle from the bytes the page already downloaded', async () =>
    {
        const fetch = vi.fn();
        const buffer = new ArrayBuffer(16);

        vi.stubGlobal('fetch', fetch);
        holder.__octanePrefetchData = new Map([ [ BUNDLE_URL, Promise.resolve({ ok: true, status: 200, buffer }) ] ]);

        const { manager, dependencies } = createManager();

        await expect(manager.downloadAsset(BUNDLE_URL)).resolves.toBe(true);

        expect(fetch).not.toHaveBeenCalled();
        expect(vi.mocked(dependencies.loadOctaneBundle).mock.calls[0][0]).toBe(buffer);
        expect(holder.__octanePrefetchData.size).toBe(0);
    });

    it('fetches a bundle whose early download failed', async () =>
    {
        const fetch = vi.fn(async () => new Response(new ArrayBuffer(4), { status: 200 }));

        vi.stubGlobal('fetch', fetch);
        holder.__octanePrefetchData = new Map([ [ BUNDLE_URL, Promise.resolve({ ok: false, status: 404 }) ] ]);

        const { manager } = createManager();

        await expect(manager.downloadAsset(BUNDLE_URL)).resolves.toBe(true);
        expect(fetch).toHaveBeenCalledOnce();
    });

    it('uses the page\'s early request for the first try only', async () =>
    {
        const fetch = vi.fn(async () => new Response(new ArrayBuffer(4), { status: 200 }));

        vi.stubGlobal('fetch', fetch);
        holder.__octanePrefetchCache = new Map([ [ BUNDLE_URL, Promise.resolve(new Response(null, { status: 503 })) ] ]);

        const { manager, dependencies } = createManager();

        await expect(manager.downloadAsset(BUNDLE_URL)).resolves.toBe(true);

        // The early answer was a server error: the retry fetched anew.
        expect(fetch).toHaveBeenCalledOnce();
        expect(dependencies.wait).toHaveBeenCalledOnce();
    });

    it('leaves the page\'s downloads alone with an injected fetch', async () =>
    {
        const fetch = vi.fn(async () => new Response(new ArrayBuffer(4), { status: 200 }));

        holder.__octanePrefetchData = new Map([ [ BUNDLE_URL, Promise.resolve({ ok: true, status: 200, buffer: new ArrayBuffer(16) }) ] ]);

        const { manager } = createManager({ fetch });

        await manager.downloadAsset(BUNDLE_URL);

        expect(fetch).toHaveBeenCalledOnce();
        expect(holder.__octanePrefetchData.size).toBe(1);
    });
});

describe('AssetManager local room library', () =>
{
    const loadedSources = (dependencies: AssetManagerDependencies): string[] =>
        vi.mocked(dependencies.loadImageResource).mock.calls.map(([ request ]) => request.source);

    it('finishes without the landscapes and adds them right after', async () =>
    {
        const { manager, dependencies } = createManager();

        await expect(manager.downloadAsset('local://room')).resolves.toBe(true);

        const collection = manager.getCollection('room');
        const eagerCount = loadedSources(dependencies).length;

        expect(collection).not.toBeNull();
        expect(eagerCount).toBeGreaterThan(0);
        expect(collection.getTexture('landscape_64_1_foreground_1')).toBeUndefined();
        expect(collection.getAsset('landscape_64_1_foreground_1')).toBeNull();

        await manager.whenRoomAssetsReady();

        expect(loadedSources(dependencies).length).toBe(eagerCount + 40);
        expect(collection.getTexture('landscape_64_1_foreground_1')).toBeDefined();
        expect(collection.getAsset('landscape_64_1_foreground_1')).not.toBeNull();
        expect(collection.getAsset('landscape_64_1_foreground_1_flipH')?.flipH).toBe(true);
        expect(manager.getAsset('landscape_64_1_foreground_1')).not.toBeNull();
    });

    it('keeps the first-pass assets when the landscapes are defined', async () =>
    {
        const { manager } = createManager();

        await manager.downloadAsset('local://room');

        const collection = manager.getCollection('room') as unknown as GraphicAssetCollection;
        const before = new Map([ ...collection.assetNames ].map(name => [ name, collection.getAsset(name) ]));

        expect(before.size).toBeGreaterThan(0);

        await manager.whenRoomAssetsReady();

        for(const [ name, asset ] of before) expect(collection.getAsset(name)).toBe(asset);
    });

    it('still finishes when a landscape image fails', async () =>
    {
        const loadImageResource = vi.fn().mockImplementation(async ({ source }: { source: string }) =>
        {
            if(source.includes('landscape_64_1_')) throw new Error('broken image');

            return createResource();
        });
        const { manager } = createManager({ loadImageResource });

        await manager.downloadAsset('local://room');
        await expect(manager.whenRoomAssetsReady()).resolves.toBeUndefined();

        const collection = manager.getCollection('room');

        expect(collection.getAsset('landscape_64_1_foreground_1')).toBeNull();
        expect(collection.getAsset('landscape_64_2_foreground_1')).not.toBeNull();
    });
});
