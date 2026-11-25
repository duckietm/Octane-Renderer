import { FurnitureType } from '@octane/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const downloadAsset = vi.fn<(url: string) => Promise<boolean>>();
const config: Record<string, unknown> = {};

vi.mock('@octane/assets', async importOriginal => ({
    ...(await importOriginal<object>()),
    GetAssetManager: () => ({ downloadAsset, getCollection: () => null })
}));

vi.mock('@octane/configuration', async importOriginal => ({
    ...(await importOriginal<object>()),
    GetConfiguration: () => ({ getValue: (key: string, fallback?: unknown) => (key in config ? config[key] : fallback) })
}));

const getAllFurnitureData = vi.fn();

vi.mock('@octane/session', async importOriginal => ({
    ...(await importOriginal<object>()),
    GetSessionDataManager: () => ({ getAllFurnitureData })
}));

const FURNITURE_DATA = () => [
    { type: FurnitureType.WALL, id: 1, className: 'landscape', revision: 1 },
    { type: FurnitureType.FLOOR, id: 2, className: 'party_nt_shelf', revision: 1 }
];

const { RoomContentLoader } = await import('../RoomContentLoader');

describe('RoomContentLoader start-up', () =>
{
    beforeEach(() =>
    {
        downloadAsset.mockReset();
        getAllFurnitureData.mockReset();
        getAllFurnitureData.mockImplementation(FURNITURE_DATA);
        for(const key of Object.keys(config)) delete config[key];
        config['furni.asset.url'] = 'http://cdn/hab/%libname%.hab';
    });

    it('starts when one library fails to load', async () =>
    {
        downloadAsset.mockImplementation(async url =>
        {
            if(url.includes('landscape')) throw new Error('broken landscape');
            return true;
        });

        const loader = new RoomContentLoader();

        await expect(loader.init()).resolves.toBeUndefined();
        expect(downloadAsset).toHaveBeenCalledWith('http://cdn/hab/landscape.hab');
        expect(downloadAsset).toHaveBeenCalledWith('local://room');
    });

    it('preloads the shipped libraries without the session data, and init reuses that load', async () =>
    {
        downloadAsset.mockResolvedValue(true);

        const loader = new RoomContentLoader();
        const preload = loader.preloadMandatoryLibraries();

        expect(loader.preloadMandatoryLibraries()).toBe(preload);
        await preload;

        expect(getAllFurnitureData).not.toHaveBeenCalled();
        expect(downloadAsset).toHaveBeenCalledWith('local://room');
        expect(downloadAsset).toHaveBeenCalledWith('local://variablefx');
        expect(downloadAsset).not.toHaveBeenCalledWith('http://cdn/hab/landscape.hab');

        const before = downloadAsset.mock.calls.length;

        await loader.init();

        // Only the landscape is new; floor_editor is no longer loaded at boot.
        expect(downloadAsset.mock.calls.slice(before).map(([ url ]) => url)).toEqual([ 'http://cdn/hab/landscape.hab' ]);
        expect(downloadAsset).not.toHaveBeenCalledWith('local://floor_editor');
        expect(getAllFurnitureData).toHaveBeenCalledOnce();
    });

    it('never rejects a preload, even when a shipped library fails', async () =>
    {
        downloadAsset.mockImplementation(async url =>
        {
            if(url === 'local://room') throw new Error('broken room');
            return true;
        });

        await expect(new RoomContentLoader().preloadMandatoryLibraries()).resolves.toBeUndefined();
    });
});
