import { RoomObjectCategory } from '@octane/api';
import { TextureUtils } from '@octane/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomEngine } from './RoomEngine';
import { RoomObjectImageCache } from './RoomObjectImageCache';

vi.mock('./GetRoomMessageHandler', () => ({
    GetRoomMessageHandler: () => ({ dispose: vi.fn() })
}));

vi.mock('./GetRoomEngine', () => ({
    GetRoomEngine: () => null
}));

const direction = { x: 0, y: 0, z: 0 } as any;

const makeTexture = () => ({ destroyed: false, destroy: vi.fn(function (this: any) { this.destroyed = true; }) });

const makeEngine = (loaded: boolean) =>
{
    const objects: any[] = [];
    const renders: any[] = [];
    const removed: number[] = [];

    const roomInstance = {
        createRoomObjectAndInitalize: (id: number, type: string) =>
        {
            const model = new Map<string, any>();
            const object = {
                id,
                type,
                model: { setValue: (k: string, v: any) => model.set(k, v), getValue: (k: string) => model.get(k) },
                logic: { processUpdateMessage: vi.fn() },
                visualization: {
                    update: vi.fn(),
                    getImage: () => { const t = makeTexture(); renders.push(t); return t; },
                    get image() { return renders[renders.length - 1]; }
                },
                setDirection: vi.fn()
            };

            objects.push(object);

            return object;
        },
        removeRoomObject: (id: number) => { removed.push(id); },
        getManager: () => ({ objects: { length: objects.length, getValues: () => objects } })
    };

    const engine = Object.create(RoomEngine.prototype) as RoomEngine;

    Object.assign(engine, {
        _roomManager: { getRoomInstance: () => roomInstance, createRoomInstance: () => roomInstance },
        _roomContentLoader: { getCollection: () => (loaded ? {} : null), getCategoryForType: () => RoomObjectCategory.FLOOR },
        _imageObjectIdBank: { reserveNumber: () => 0, freeNumber: vi.fn() },
        _imageCallbacks: new Map(),
        _imageCache: new RoomObjectImageCache(8),
        getRoomObjectCategoryForType: () => RoomObjectCategory.FLOOR
    });

    return { engine, renders, removed, objects };
};

describe('RoomEngine image cache wiring', () =>
{
    beforeEach(() =>
    {
        vi.spyOn(TextureUtils, 'generateImage').mockResolvedValue({ fake: true } as any);
    });

    it('renders once for two identical requests and shares the entry', () =>
    {
        const { engine, renders } = makeEngine(true);

        const first = engine.getGenericRoomObjectImage('chair', '1', direction, 64, null);
        const second = engine.getGenericRoomObjectImage('chair', '1', direction, 64, null);

        expect(renders.length).toBe(1);
        expect(second.data).toBe(first.data);
        expect(first.getImage()).toBe(second.getImage());
    });

    it('renders again for a different direction', () =>
    {
        const { engine, renders } = makeEngine(true);

        engine.getGenericRoomObjectImage('chair', '1', direction, 64, null);
        engine.getGenericRoomObjectImage('chair', '1', { x: 4, y: 0, z: 0 } as any, 64, null);

        expect(renders.length).toBe(2);
    });

    it('keeps the deferred path when the asset is not loaded', () =>
    {
        const { engine } = makeEngine(false);
        const listener = { imageReady: vi.fn(), imageFailed: vi.fn() };

        const result = engine.getGenericRoomObjectImage('chair', '1', direction, 64, listener);

        expect(engine['_imageCallbacks'].size).toBe(1);
        expect(engine['_imageCache'].size).toBe(0);
        expect(result.id).toBe(1);
    });

    it('stores the deferred delivery and hands the listener a shared result', () =>
    {
        const { engine } = makeEngine(false);
        const listener = { imageReady: vi.fn(), imageFailed: vi.fn() };

        engine.getGenericRoomObjectImage('chair', '1', direction, 64, listener);
        engine.initalizeTemporaryObjectsByType('chair', false);

        expect(listener.imageReady).toHaveBeenCalledTimes(1);

        const result = listener.imageReady.mock.calls[0][0];
        const cache: RoomObjectImageCache = engine['_imageCache'];
        const key = engine['_roomManager'].getRoomInstance('temporary_room');

        expect(result.id).toBe(1);
        expect(cache.size).toBe(1);

        const entry = [ ...(cache as any)._entries.values() ][0];

        expect(entry.texture).toBe(result.data);
        void key;
    });

    it('clearRoomObjectImageCache empties the cache and destroys textures', () =>
    {
        const { engine } = makeEngine(true);

        engine.getGenericRoomObjectImage('chair', '1', direction, 64, null);

        const cache: RoomObjectImageCache = engine['_imageCache'];
        const entry = [ ...(cache as any)._entries.values() ][0];
        const texture = entry.texture;

        engine.clearRoomObjectImageCache();

        expect(cache.size).toBe(0);
        expect(texture.destroy).toHaveBeenCalledWith(true);
    });

    it('dispose clears the cache', () =>
    {
        const { engine } = makeEngine(true);

        engine.getGenericRoomObjectImage('chair', '1', direction, 64, null);

        Object.assign(engine, {
            _roomSessionEventCallback: null,
            _roomDatas: new Map(),
            _roomInstanceDatas: new Map(),
            _thumbnailCallbacks: new Map(),
            _badgeListenerObjects: new Map()
        });

        const cache: RoomObjectImageCache = engine['_imageCache'];

        engine.dispose();

        expect(cache.size).toBe(0);
    });
});
