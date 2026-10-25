import { describe, expect, it, vi } from 'vitest';
import { AvatarAssetDownloadLibrary } from './AvatarAssetDownloadLibrary';
import { AvatarAssetDownloadManager } from './AvatarAssetDownloadManager';

const failingAssets = () => ({ getCollection: () => null, downloadAsset: vi.fn(async () => false) });

describe('a failed avatar library', () =>
{
    it('is not downloaded again until its wait is over, and the wait grows', async () =>
    {
        let now = 0;
        const assets = failingAssets();
        const library = new AvatarAssetDownloadLibrary('hh_missing', '1', '/%libname%.nitro', assets as never, () => now);

        await expect(library.downloadAsset()).rejects.toThrow();
        expect(library.isBackingOff).toBe(true);

        await expect(library.downloadAsset()).rejects.toThrow('backing off');
        expect(assets.downloadAsset).toHaveBeenCalledTimes(1);

        now += AvatarAssetDownloadLibrary.RETRY_BASE_MS;
        await expect(library.downloadAsset()).rejects.toThrow('Could not download asset');
        expect(assets.downloadAsset).toHaveBeenCalledTimes(2);

        now += AvatarAssetDownloadLibrary.RETRY_BASE_MS;
        expect(library.isBackingOff).toBe(true);
    });
});

describe('figures waiting for a failed library', () =>
{
    const managerWith = (library: AvatarAssetDownloadLibrary) =>
    {
        const manager = new AvatarAssetDownloadManager(null, null);

        vi.spyOn(manager, 'getAvatarFigurePendingLibraries').mockReturnValue([ library ]);

        const internals = manager as unknown as { _incompleteFigures: Map<string, unknown>; _figureListeners: Map<string, unknown[]> };

        return { manager, internals };
    };

    const container = (figure: string) => ({ getFigureString: () => figure }) as never;

    it('are forgotten with their listeners, without an unhandled rejection', async () =>
    {
        const library = new AvatarAssetDownloadLibrary('hh_missing', '1', '/%libname%.nitro', failingAssets() as never);
        const { manager, internals } = managerWith(library);
        const unhandled = vi.fn();

        process.on('unhandledRejection', unhandled);
        manager.downloadAvatarFigure(container('hd-180-1.ch-9999-1'), { disposed: false, resetFigure: vi.fn(), dispose: vi.fn() });
        await new Promise(resolve => setTimeout(resolve, 0));
        process.off('unhandledRejection', unhandled);

        expect(unhandled).not.toHaveBeenCalled();
        expect(internals._incompleteFigures.size).toBe(0);
        expect(internals._figureListeners.size).toBe(0);
    });

    it('do not keep the views that were disposed meanwhile', () =>
    {
        const library = new AvatarAssetDownloadLibrary('hh_slow', '1', '/%libname%.nitro', { getCollection: () => null, downloadAsset: () => new Promise(() => undefined) } as never);
        const { manager, internals } = managerWith(library);
        const gone = { disposed: false, resetFigure: vi.fn(), dispose: vi.fn() };
        const current = { disposed: false, resetFigure: vi.fn(), dispose: vi.fn() };

        manager.downloadAvatarFigure(container('hd-1'), gone);
        gone.disposed = true;
        manager.downloadAvatarFigure(container('hd-1'), current);

        expect(internals._figureListeners.get('hd-1')).toEqual([ current ]);
    });
});
