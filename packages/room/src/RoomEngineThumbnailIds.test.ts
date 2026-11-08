import { NumberBank } from '@octane/utils';
import { describe, expect, it, vi } from 'vitest';
import { RoomEngine } from './RoomEngine';

vi.mock('./GetRoomMessageHandler', () => ({
    GetRoomMessageHandler: () => ({ dispose: vi.fn() })
}));

vi.mock('./GetRoomEngine', () => ({
    GetRoomEngine: () => null
}));

const makeEngine = (downloads: boolean = true) =>
{
    const bank = new NumberBank(2);
    const downloadImage = vi.fn(() => downloads);
    const engine = Object.create(RoomEngine.prototype) as RoomEngine;

    Object.assign(engine, {
        _roomManager: { getRoomInstance: () => ({}) },
        _roomContentLoader: { getImage: (): HTMLImageElement => null, downloadImage },
        _thumbnailObjectIdBank: bank,
        _thumbnailCallbacks: new Map(),
        _thumbnailRequestIds: new Map()
    });

    return { engine, bank, downloadImage };
};

const listener = () => ({ imageReady: vi.fn(), imageFailed: vi.fn() });

describe('RoomEngine thumbnail request ids', () =>
{
    it('answers a repeated request under the id of the one already on its way', () =>
    {
        const { engine, bank, downloadImage } = makeEngine();

        const first = engine.getGenericRoomObjectThumbnail('chair', '0', listener());
        const second = engine.getGenericRoomObjectThumbnail('chair', '0', listener());

        expect(downloadImage).toHaveBeenCalledTimes(1);
        expect(second.id).toBe(first.id);

        engine.onRoomContentLoaded(first.id, 'chair_0', false);

        // Both ids of the bank are free again, so two new requests still get one each.
        expect(bank.reserveNumber()).toBeGreaterThanOrEqual(0);
        expect(bank.reserveNumber()).toBeGreaterThanOrEqual(0);
    });

    it('returns the id when there is nothing to download', () =>
    {
        const { engine, bank } = makeEngine(false);

        const result = engine.getGenericRoomObjectThumbnail('chair', '0', listener());

        expect(result.id).toBe(0);
        expect(bank.reserveNumber()).toBeGreaterThanOrEqual(0);
        expect(bank.reserveNumber()).toBeGreaterThanOrEqual(0);

        // The next request for the same image starts its own download instead of waiting forever.
        bank.freeNumber(0);
        bank.freeNumber(1);

        expect(engine.getGenericRoomObjectThumbnail('chair', '0', listener()).id).toBe(0);
    });
});
