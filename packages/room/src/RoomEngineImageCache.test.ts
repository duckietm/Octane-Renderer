import { RoomObjectCategory } from '@octane/api';
import { TextureUtils } from '@octane/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomEngine } from './RoomEngine';
import { buildRoomObjectImageKey, RoomObjectImageCache } from './RoomObjectImageCache';

vi.mock('./GetRoomMessageHandler', () => ({
    GetRoomMessageHandler: () => ({ dispose: vi.fn() })
}));

vi.mock('./GetRoomEngine', () => ({
    GetRoomEngine: () => null
}));

const direction = { x: 0, y: 0, z: 0 } as any;

const makeTexture = () => ({ destroyed: false, destroy: vi.fn(function (this: any) { this.destroyed = true; }) });

/** A room instance backing fake whose objects each remember their own last render, so the shared fake also covers duplicate-delivery cases. */
const makeRoomInstance = (objects: any[], renders: any[], removed: number[]) => ({
    createRoomObjectAndInitalize: (id: number, type: string) =>
    {
        const model = new Map<string, any>();
        let ownTexture: any = null;
        const object = {
            id,
            type,
            model: { setValue: (k: string, v: any) => model.set(k, v), getValue: (k: string) => model.get(k) },
            logic: { processUpdateMessage: vi.fn() },
            visualization: {
                update: vi.fn(),
                getImage: () => { if(!ownTexture) { ownTexture = makeTexture(); renders.push(ownTexture); } return ownTexture; },
                get image() { return ownTexture; }
            },
            setDirection: vi.fn()
        };

        objects.push(object);

        return object;
    },
    removeRoomObject: (id: number) => { removed.push(id); },
    getManager: () => ({ objects: { length: objects.length, getValues: () => objects } })
});

const makeEngine = (loaded: boolean) =>
{
    const objects: any[] = [];
    const renders: any[] = [];
    const removed: number[] = [];

    const roomInstance = makeRoomInstance(objects, renders, removed);

    let nextId = 0;
    const engine = Object.create(RoomEngine.prototype) as RoomEngine;

    Object.assign(engine, {
        _roomManager: { getRoomInstance: () => roomInstance, createRoomInstance: () => roomInstance },
        _roomContentLoader: { getCollection: () => (loaded ? {} : null), getCategoryForType: () => RoomObjectCategory.FLOOR },
        _imageObjectIdBank: { reserveNumber: () => nextId++, freeNumber: vi.fn() },
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

    afterEach(() =>
    {
        vi.restoreAllMocks();
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

    it('finds a cached entry only under the key for its own state', () =>
    {
        const { engine, renders } = makeEngine(true);

        const stateZero = engine.getGenericRoomObjectImage('chair', '1', direction, 64, null, 0, null, null, 0);
        const stateTwo = engine.getGenericRoomObjectImage('chair', '1', direction, 64, null, 0, null, null, 2);

        expect(renders.length).toBe(2);

        const cache: RoomObjectImageCache = engine['_imageCache'];

        expect(cache.get(buildRoomObjectImageKey('chair', '1', direction, 64, null, null, 0, -1, null))).toBeDefined();
        expect(cache.get(buildRoomObjectImageKey('chair', '1', direction, 64, null, null, 2, -1, null))).toBeDefined();
        expect(cache.get(buildRoomObjectImageKey('chair', '1', direction, 64, null, null, 0, -1, null))?.texture).toBe(stateZero.data);
        expect(cache.get(buildRoomObjectImageKey('chair', '1', direction, 64, null, null, 2, -1, null))?.texture).toBe(stateTwo.data);
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

    it('stores the deferred delivery under the built key and hands the listener a shared result', () =>
    {
        const { engine } = makeEngine(false);
        const listener = { imageReady: vi.fn(), imageFailed: vi.fn() };

        engine.getGenericRoomObjectImage('chair', '1', direction, 64, listener);
        engine.initalizeTemporaryObjectsByType('chair', true);

        expect(listener.imageReady).toHaveBeenCalledTimes(1);

        const result = listener.imageReady.mock.calls[0][0];
        const cache: RoomObjectImageCache = engine['_imageCache'];

        expect(result.id).toBe(1);
        expect(cache.size).toBe(1);

        const entry = cache.get(buildRoomObjectImageKey('chair', '1', direction, 64, null, null, -1, -1, null));

        expect(entry).toBeDefined();
        expect(entry.texture).toBe(result.data);
    });

    it('a failed content load is delivered but never cached', () =>
    {
        const { engine } = makeEngine(false);
        const listener = { imageReady: vi.fn(), imageFailed: vi.fn() };

        engine.getGenericRoomObjectImage('chair', '1', direction, 64, listener);
        engine.initalizeTemporaryObjectsByType('chair', false);

        expect(listener.imageReady).toHaveBeenCalledTimes(1);
        expect(listener.imageFailed).not.toHaveBeenCalled();

        const cache: RoomObjectImageCache = engine['_imageCache'];

        expect(cache.size).toBe(0);
        expect(cache.get(buildRoomObjectImageKey('chair', '1', direction, 64, null, null, -1, -1, null))).toBeUndefined();

        const secondListener = { imageReady: vi.fn(), imageFailed: vi.fn() };

        engine.getGenericRoomObjectImage('chair', '1', direction, 64, secondListener);

        expect(engine['_imageCallbacks'].size).toBe(1);
        expect(secondListener.imageReady).not.toHaveBeenCalled();
    });

    it('reuses one cache entry when two deferred requests for the same key are delivered together', () =>
    {
        const objects: any[] = [];
        const renders: any[] = [];
        const removed: number[] = [];

        const roomInstance = makeRoomInstance(objects, renders, removed);

        let nextId = 0;

        const engine = Object.create(RoomEngine.prototype) as RoomEngine;

        Object.assign(engine, {
            _roomManager: { getRoomInstance: () => roomInstance, createRoomInstance: () => roomInstance },
            _roomContentLoader: { getCollection: () => null, getCategoryForType: () => RoomObjectCategory.FLOOR },
            _imageObjectIdBank: { reserveNumber: () => nextId++, freeNumber: vi.fn() },
            _imageCallbacks: new Map(),
            _imageCache: new RoomObjectImageCache(8),
            getRoomObjectCategoryForType: () => RoomObjectCategory.FLOOR
        });

        const listenerA = { imageReady: vi.fn(), imageFailed: vi.fn() };
        const listenerB = { imageReady: vi.fn(), imageFailed: vi.fn() };

        engine.getGenericRoomObjectImage('chair', '1', direction, 64, listenerA);
        engine.getGenericRoomObjectImage('chair', '1', direction, 64, listenerB);

        engine.initalizeTemporaryObjectsByType('chair', true);

        expect(listenerA.imageReady).toHaveBeenCalledTimes(1);
        expect(listenerB.imageReady).toHaveBeenCalledTimes(1);

        const resultA = listenerA.imageReady.mock.calls[0][0];
        const resultB = listenerB.imageReady.mock.calls[0][0];

        expect(resultA.data).toBe(resultB.data);

        const cache: RoomObjectImageCache = engine['_imageCache'];

        expect(cache.size).toBe(1);
        expect(renders.length).toBe(2);
        expect(resultA.data).toBe(renders[0]);
        expect(renders[0].destroy).not.toHaveBeenCalled();
        expect(renders[1].destroy).toHaveBeenCalledWith(true);
    });

    it('a request through the uncached mover path does not hit or store the cache', () =>
    {
        const { engine, renders } = makeEngine(true);

        engine.getGenericRoomObjectImage('chair', '1', direction, 64, null);

        const cache: RoomObjectImageCache = engine['_imageCache'];

        expect(cache.size).toBe(1);

        const uncachedResult = (engine as any).getGenericRoomObjectImageUncached('chair', '1', direction, 64, null);

        expect(cache.size).toBe(1);
        expect(renders.length).toBe(2);
        expect(uncachedResult.data).not.toBe(renders[0]);
    });

    it('a non-legacy objectData renders every time and stores nothing', () =>
    {
        const { engine, renders } = makeEngine(true);
        const fakeMapData = { getLegacyString: () => '3' } as any;

        engine.getGenericRoomObjectImage('chair', '1', direction, 64, null, 0, null, fakeMapData);
        engine.getGenericRoomObjectImage('chair', '1', direction, 64, null, 0, null, fakeMapData);

        expect(renders.length).toBe(2);

        const cache: RoomObjectImageCache = engine['_imageCache'];

        expect(cache.size).toBe(0);
    });

    it('clearRoomObjectImageCache empties the cache and destroys textures', () =>
    {
        const { engine } = makeEngine(true);

        engine.getGenericRoomObjectImage('chair', '1', direction, 64, null);

        const cache: RoomObjectImageCache = engine['_imageCache'];
        const entry = cache.get(buildRoomObjectImageKey('chair', '1', direction, 64, null, null, -1, -1, null));
        const texture = entry.texture;

        engine.clearRoomObjectImageCache();

        expect(cache.size).toBe(0);
        expect(texture.destroy).toHaveBeenCalledWith(true);
    });

    it('clearRoomObjectImageCache(type) only drops that type', () =>
    {
        const { engine } = makeEngine(true);

        engine.getGenericRoomObjectImage('chair', '1', direction, 64, null);

        const cache: RoomObjectImageCache = engine['_imageCache'];

        engine.clearRoomObjectImageCache('table');

        expect(cache.size).toBe(1);

        engine.clearRoomObjectImageCache('chair');

        expect(cache.size).toBe(0);
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
