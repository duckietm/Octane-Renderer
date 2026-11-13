import { RoomObjectCategory, RoomObjectVariable } from '@octane/api';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RoomEngine } from './RoomEngine';
import { RoomObjectImageCache } from './RoomObjectImageCache';
import { RoomGeometry } from './utils';

vi.mock('./GetRoomMessageHandler', () => ({
    GetRoomMessageHandler: () => ({})
}));

vi.mock('./GetRoomEngine', () => ({
    GetRoomEngine: () => null
}));

/**
 * What happens to the temporary objects of a type once its content has loaded: which objects are rendered and with
 * which geometry, which are removed, what their listeners receive, and what the image cache keeps or destroys. Every
 * call is recorded in order, so the method that does it can be taken apart.
 */

const TYPE = 'chair';

interface FakeObject
{
    id: number;
    type?: string;
    scale?: number;
    key?: string | null;
    noModel?: boolean;
    noVisualization?: boolean;
    noTexture?: boolean;
    listeners?: ('ok' | null)[];
}

interface Options
{
    noInstance?: boolean;
    noManager?: boolean;
    contentLoaded?: boolean;
    cached?: { key: string; same?: number; destroyed?: boolean }[];
}

afterEach(() => vi.restoreAllMocks());

const run = (objects: FakeObject[], options: Options = {}) =>
{
    const log: string[] = [];
    const geometries = new Map<unknown, number>();
    const geometryName = (geometry: unknown) =>
    {
        if(!geometries.has(geometry)) geometries.set(geometry, geometries.size + 1);

        return `g${geometries.get(geometry)}`;
    };

    vi.spyOn(RoomGeometry.prototype, 'dispose').mockImplementation(function(this: unknown)
    {
        log.push(`dispose ${geometryName(this)}`);
    });

    const textures = new Map<number, { name: string; destroyed: boolean; destroy: () => void }>();
    const makeTexture = (name: string, destroyed = false) => ({
        name,
        destroyed,
        destroy(this: { name: string; destroyed: boolean })
        {
            this.destroyed = true;
            log.push(`destroy ${this.name}`);
        }
    });

    const cache = new RoomObjectImageCache(8);

    for(const cached of options.cached ?? [])
    {
        const texture = cached.same !== undefined ? null : makeTexture(`cached ${cached.key}`);

        if(texture) cache.set(cached.key, texture as never);
        else textures.set(cached.same, makeTexture(`texture ${cached.same}`, !!cached.destroyed));

        if(!texture) cache.set(cached.key, textures.get(cached.same) as never);
    }

    const roomObjects = objects.map((object) =>
    {
        if(!object.noTexture && !textures.has(object.id)) textures.set(object.id, makeTexture(`texture ${object.id}`));

        const values = new Map<string, unknown>([
            [ RoomObjectVariable.IMAGE_QUERY_SCALE, object.scale ?? 64 ],
            [ RoomObjectVariable.IMAGE_QUERY_KEY, object.key ?? null ]
        ]);

        return {
            id: object.id,
            type: object.type ?? TYPE,
            model: object.noModel ? null : { getValue: (key: string) => values.get(key) },
            visualization: object.noVisualization ? null : {
                update: (geometry: RoomGeometry, time: number, update: boolean, skip: boolean) => log.push(`update ${object.id} ${geometryName(geometry)} scale ${geometry.scale} ${time} ${update} ${skip}`),
                get image()
                {
                    return object.noTexture ? null : textures.get(object.id);
                }
            }
        };
    });

    const callbacks = new Map<string, unknown[]>();

    for(const object of objects)
    {
        if(!object.listeners) continue;

        callbacks.set(object.id.toString(), object.listeners.map((listener, index) => (listener ? {
            imageReady: (result: { constructor: { name: string }; id: number; data: { name: string } }) => log.push(`imageReady ${object.id}#${index} ${result.constructor.name} id ${result.id} data ${result.data?.name}`),
            imageFailed: (id: number) => log.push(`imageFailed ${object.id}#${index} ${id}`)
        } : null)));
    }

    const engine = Object.create(RoomEngine.prototype);

    Object.assign(engine, {
        _roomManager: {
            getRoomInstance: () => (options.noInstance ? null : {
                getManager: (category: number) => (log.push(`getManager ${category}`), options.noManager ? null : {
                    objects: { length: roomObjects.length, getValues: () => roomObjects }
                }),
                removeRoomObject: (id: number, category: number) => log.push(`remove ${id} ${category}`)
            })
        },
        _roomContentLoader: { getCategoryForType: () => RoomObjectCategory.FLOOR },
        _imageObjectIdBank: { freeNumber: (id: number) => log.push(`freeNumber ${id}`) },
        _imageCallbacks: callbacks,
        _imageCache: cache
    });

    engine.initalizeTemporaryObjectsByType(TYPE, options.contentLoaded ?? true);

    return {
        log,
        listenersLeft: [ ...callbacks.keys() ],
        cache: [ ...(options.cached ?? []).map((cached) => cached.key), ...objects.map((object) => object.key).filter(Boolean) ]
            .filter((key, index, all) => all.indexOf(key) === index)
            .map((key) => `${key}: ${(cache.get(key)?.texture as unknown as { name: string })?.name ?? 'none'}`)
    };
};

describe('RoomEngine temporary objects by type', () =>
{
    it('renders each object of the type, frees it and hands its listeners the image', () =>
    {
        expect(run([
            { id: 1, key: 'a', listeners: [ 'ok' ] },
            { id: 2, key: 'b', listeners: [ 'ok', null, 'ok' ] },
            { id: 3, type: 'table', key: 'c', listeners: [ 'ok' ] }
        ])).toMatchSnapshot();
    });

    it('reuses one geometry for objects of the same scale and makes a new one when the scale changes', () =>
    {
        expect(run([
            { id: 1, scale: 64 },
            { id: 2, scale: 64 },
            { id: 3, scale: 32 },
            { id: 4, scale: 64 }
        ])).toMatchSnapshot();
    });

    it('skips objects without a model, and frees objects without a visualization or a texture', () =>
    {
        expect(run([
            { id: 1, noModel: true, listeners: [ 'ok' ] },
            { id: 2, noVisualization: true, key: 'b', listeners: [ 'ok' ] },
            { id: 3, noTexture: true, key: 'c', listeners: [ 'ok', null ] },
            { id: 4, key: 'd' }
        ])).toMatchSnapshot();
    });

    it('stores nothing when the content failed to load or there is no key', () =>
    {
        expect(run([ { id: 1, key: 'a', listeners: [ 'ok' ] } ], { contentLoaded: false })).toMatchSnapshot('content failed');
        expect(run([ { id: 1, key: null, listeners: [ 'ok' ] } ])).toMatchSnapshot('no key');
    });

    it('uses an entry that is already cached and destroys the duplicate texture', () =>
    {
        expect(run([ { id: 1, key: 'a', listeners: [ 'ok' ] } ], { cached: [ { key: 'a' } ] })).toMatchSnapshot('other texture');
        expect(run([ { id: 1, key: 'a', listeners: [ 'ok' ] } ], { cached: [ { key: 'a', same: 1 } ] })).toMatchSnapshot('same texture');
        expect(run([ { id: 1, key: 'a', listeners: [ 'ok' ] }, { id: 2, key: 'a', listeners: [ 'ok' ] } ])).toMatchSnapshot('two objects, one key');
        expect(run([ { id: 1, key: 'a', listeners: [ 'ok' ] } ], { cached: [ { key: 'a' } ], contentLoaded: false })).toMatchSnapshot('cached, content failed');
    });

    it('does nothing without a temporary room, an object manager or objects', () =>
    {
        expect(run([ { id: 1, listeners: [ 'ok' ] } ], { noInstance: true })).toMatchSnapshot('no instance');
        expect(run([ { id: 1, listeners: [ 'ok' ] } ], { noManager: true })).toMatchSnapshot('no manager');
        expect(run([])).toMatchSnapshot('no objects');
    });
});
