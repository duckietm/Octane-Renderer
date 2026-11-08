import { GetEventDispatcher, RoomContentLoadedEvent } from '@octane/events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RoomContentLoader } from './RoomContentLoader';

const downloadAsset = vi.fn();

vi.mock('@octane/assets', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    GetAssetManager: () => ({ downloadAsset, getCollection: (): null => null })
}));

describe('RoomContentLoader downloadAssetSync', () =>
{
    afterEach(() => downloadAsset.mockReset());

    it('reports a download that did not load as a failure and lets it be asked again', async () =>
    {
        downloadAsset.mockResolvedValue(false);

        const loader = new RoomContentLoader();
        const events: string[] = [];
        const listener = (event: RoomContentLoadedEvent) => events.push(event.type);

        vi.spyOn(loader, 'getAssetUrls').mockReturnValue([ 'chair.nitro' ]);

        GetEventDispatcher().addEventListener(RoomContentLoadedEvent.RCLE_SUCCESS, listener);
        GetEventDispatcher().addEventListener(RoomContentLoadedEvent.RCLE_FAILURE, listener);

        try
        {
            loader.downloadAssetSync('chair');

            await vi.waitFor(() => expect(events).toEqual([ RoomContentLoadedEvent.RCLE_FAILURE ]));

            loader.downloadAssetSync('chair');

            expect(downloadAsset).toHaveBeenCalledTimes(2);
        }
        finally
        {
            GetEventDispatcher().removeEventListener(RoomContentLoadedEvent.RCLE_SUCCESS, listener);
            GetEventDispatcher().removeEventListener(RoomContentLoadedEvent.RCLE_FAILURE, listener);
        }
    });
});
