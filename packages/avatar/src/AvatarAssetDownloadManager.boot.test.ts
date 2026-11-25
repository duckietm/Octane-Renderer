import { GetConfiguration } from '@octane/configuration';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const figureMap = vi.hoisted((): { resolve: (value: unknown) => void } => ({ resolve: null }));

vi.mock('@octane/utils', async importOriginal => ({
    ...(await importOriginal<object>()),
    loadGamedata: () => new Promise(resolve => (figureMap.resolve = resolve))
}));

const { AvatarAssetDownloadManager } = await import('./AvatarAssetDownloadManager');

const storage = (value: string | null) => ({ getItem: vi.fn(() => value) });

const createAssets = () =>
{
    const collections = new Set<string>();

    return {
        downloadAsset: vi.fn(async (url: string) =>
        {
            collections.add(url.split('/').pop().replace('.hab', ''));

            return true;
        }),
        getCollection: vi.fn((name: string) => (collections.has(name) ? {} : null))
    };
};

beforeEach(() =>
{
    localStorage.clear();
    GetConfiguration().setValue('avatar.figuremap.url', 'https://cdn.example/FigureMap.json');
    GetConfiguration().setValue('avatar.asset.url', 'https://cdn.example/clothes/%libname%.hab');
    GetConfiguration().setValue('avatar.mandatory.libraries', [ 'bd:1' ]);
});

afterEach(() => localStorage.clear());

describe('AvatarAssetDownloadManager early mandatory downloads', () =>
{
    it('remembers valid library names only, and guesses on a first boot', () =>
    {
        expect(AvatarAssetDownloadManager.readSpeculativeLibraries(storage(JSON.stringify([ 'hh_human_body', '../x', 5, 'hh_human_item' ])))).toEqual([ 'hh_human_body', 'hh_human_item' ]);
        expect(AvatarAssetDownloadManager.readSpeculativeLibraries(storage('not json'))).toEqual([ 'hh_human_body', 'hh_human_item' ]);
        expect(AvatarAssetDownloadManager.readSpeculativeLibraries(storage(JSON.stringify([ 'hh_custom' ])))).toEqual([ 'hh_custom' ]);
        expect(AvatarAssetDownloadManager.readSpeculativeLibraries(undefined)).toEqual([ 'hh_human_body', 'hh_human_item' ]);
    });

    it('starts the remembered libraries before the figure map, and remembers the ones it names', async () =>
    {
        localStorage.setItem(AvatarAssetDownloadManager.MANDATORY_LIBS_STORAGE_KEY, JSON.stringify([ 'hh_old_body' ]));

        const assets = createAssets();
        const manager = new AvatarAssetDownloadManager(assets as never, null);
        const init = manager.init();

        expect(assets.downloadAsset).toHaveBeenCalledWith('https://cdn.example/clothes/hh_old_body.hab');

        figureMap.resolve({ libraries: [ { id: 'hh_new_body', revision: '1', parts: [ { id: '1', type: 'bd' } ] } ] });
        await init;

        expect(assets.downloadAsset).toHaveBeenCalledWith('https://cdn.example/clothes/hh_new_body.hab');
        expect(JSON.parse(localStorage.getItem(AvatarAssetDownloadManager.MANDATORY_LIBS_STORAGE_KEY))).toEqual([ 'hh_new_body' ]);

        manager.dispose();
    });

    it('does not guess an address that needs the figure map\'s revision', async () =>
    {
        GetConfiguration().setValue('avatar.asset.url', 'https://cdn.example/clothes/%libname%-%revision%.hab');

        const assets = createAssets();
        const manager = new AvatarAssetDownloadManager(assets as never, null);
        const init = manager.init();

        expect(assets.downloadAsset).not.toHaveBeenCalled();

        figureMap.resolve({ libraries: [] });
        await init;

        manager.dispose();
    });
});
