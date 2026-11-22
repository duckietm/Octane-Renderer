import { LegacyDataType, RoomObjectCategory, RoomObjectUserType } from '@octane/api';
import { describe, expect, it, vi } from 'vitest';
import { RoomEngine } from './RoomEngine';
import { RoomObjectImageCache } from './RoomObjectImageCache';

vi.mock('./GetRoomMessageHandler', () => ({
    GetRoomMessageHandler: () => ({})
}));

vi.mock('./GetRoomEngine', () => ({
    GetRoomEngine: () => null
}));

/**
 * What it takes to render the image of a room object from raw parameters: which variables the model is given for each
 * kind of object, the update sent to its logic, how many frames the visualization steps, when the listener is kept
 * for later and what happens to the object afterwards. Every call the room instance, the model, the logic and the
 * visualization receive is recorded in order, so the method that does it can be taken apart.
 */

const direction = { x: 2, y: 0, z: 0 } as never;

interface Options
{
    category?: number;
    loaded?: boolean;
    noManager?: boolean;
    noInstance?: boolean;
    noIds?: boolean;
    noObject?: boolean;
    noModel?: boolean;
    noLogic?: boolean;
    noVisualization?: boolean;
    noTexture?: boolean;
    useCache?: boolean;
    cached?: boolean;
}

interface Args
{
    extras?: string;
    objectData?: unknown;
    state?: number;
    frameCount?: number;
    posture?: string;
    listener?: boolean;
    scale?: number;
}

const describeMessage = (message: unknown) => `${(message as object).constructor.name} ${JSON.stringify(message)}`;

const render = (type: string, value: string, args: Args = {}, options: Options = {}) =>
{
    const log: string[] = [];
    const texture = options.noTexture ? null : { texture: true };
    const category = options.category ?? RoomObjectCategory.FLOOR;
    const model = {
        setValue: (key: string, newValue: unknown) => log.push(`model.setValue ${key} ${JSON.stringify(newValue)}`)
    };
    const visualization = options.noVisualization ? null : {
        update: (geometry: { scale: number }, time: number, update: boolean, skip: boolean) => log.push(`visualization.update ${geometry.scale} ${time} ${update} ${skip}`),
        getImage: () => (log.push('visualization.getImage'), texture)
    };
    const roomObject = options.noObject ? null : {
        model: options.noModel ? null : model,
        logic: options.noLogic ? null : { processUpdateMessage: (message: unknown) => log.push(`logic.process ${describeMessage(message)}`) },
        visualization,
        setDirection: (newDirection: unknown) => log.push(`setDirection ${JSON.stringify(newDirection)}`)
    };
    const roomInstance = {
        createRoomObjectAndInitalize: (id: number, objectType: string, objectCategory: number) =>
        {
            log.push(`create ${id} ${objectType} ${objectCategory}`);

            return roomObject;
        },
        removeRoomObject: (id: number, objectCategory: number) => log.push(`remove ${id} ${objectCategory}`)
    };
    const cache = new RoomObjectImageCache(8);
    const engine = Object.create(RoomEngine.prototype);

    Object.assign(engine, {
        _roomManager: options.noManager ? null : {
            getRoomInstance: () => (options.noInstance ? null : roomInstance),
            createRoomInstance: () => (log.push('createRoomInstance'), options.noInstance ? null : roomInstance)
        },
        _imageObjectIdBank: { reserveNumber: () => (options.noIds ? -1 : 4), freeNumber: (id: number) => log.push(`freeNumber ${id}`) },
        _imageCallbacks: new Map(),
        _imageCache: cache,
        _roomContentLoader: { getCollection: () => (options.loaded ? {} : null) },
        getRoomObjectCategoryForType: () => category
    });

    const listener = args.listener ? { objectId: 0 } as never : null;
    const call = () => engine.renderRoomObjectImage(type, value, direction, args.scale ?? 64, listener, 0, args.extras ?? null, args.objectData ?? null, args.state ?? -1, args.frameCount ?? -1, args.posture ?? null, -1, options.useCache ?? true);
    const first = call();
    const logLengthAfterFirst = log.length;
    const second = options.cached ? call() : null;

    return {
        log,
        id: first?.id ?? null,
        data: first && texture && first.data === texture ? 'texture' : null,
        returned: first === null ? 'null' : 'result',
        secondCallAddedToLog: second ? log.length - logLengthAfterFirst : null,
        listeners: [ ...engine._imageCallbacks.entries() ].map(([ key, items ]) => `${key}:${(items as unknown[]).length}`),
        cached: cache.size
    };
};

describe('RoomEngine room object image', () =>
{
    it('renders a floor and a wall item with the colour and extras it was asked for', () =>
    {
        expect(render('chair', '12', { extras: 'extra', state: 2 }, { loaded: true })).toMatchSnapshot('floor');
        expect(render('poster', '7', { extras: 'x' }, { category: RoomObjectCategory.WALL, loaded: true })).toMatchSnapshot('wall');
        expect(render('chair', 'abc', {}, { loaded: true })).toMatchSnapshot('colour not a number');
    });

    it('gives a user, a bot and a pet the figure it was asked for', () =>
    {
        for(const type of [ RoomObjectUserType.USER, RoomObjectUserType.BOT, RoomObjectUserType.RENTABLE_BOT, RoomObjectUserType.PET ])
        {
            expect(render(type, 'hr-100.hd-180', {}, { category: RoomObjectCategory.UNIT, loaded: true })).toMatchSnapshot(`figure ${type}`);
        }
    });

    it('builds a pet from its figure string, with head only, custom parts and posture', () =>
    {
        const unit = { category: RoomObjectCategory.UNIT, loaded: true };

        expect(render('pet_dog', '0 3 ff0000 0', {}, unit)).toMatchSnapshot('plain');
        expect(render('pet_dog', '0 3 ff0000 head 0', {}, unit)).toMatchSnapshot('head only');
        expect(render('pet_dog', '0 3 ff0000 2 1 5 7 2 6 8', { posture: 'sit' }, unit)).toMatchSnapshot('custom parts and posture');
        expect(render('pet_dog', '0 3 ff0000 head 1 4 5 6', { posture: 'lay' }, unit)).toMatchSnapshot('head only with a custom part');
        expect(render('pet_dog', '', {}, unit)).toMatchSnapshot('empty figure');
    });

    it('leaves the model alone for a room object', () =>
    {
        expect(render('room', '1', {}, { category: RoomObjectCategory.ROOM, loaded: true })).toMatchSnapshot();
    });

    it('sends the state or the object data to the logic', () =>
    {
        const loaded = { loaded: true };

        expect(render('chair', '1', { state: 3 }, loaded)).toMatchSnapshot('state');
        expect(render('chair', '1', { state: 0 }, loaded)).toMatchSnapshot('state zero');
        expect(render('chair', '1', { state: -1 }, loaded)).toMatchSnapshot('no state');
        expect(render('chair', '1', { objectData: { getLegacyString: () => '17' }, state: 3 }, loaded)).toMatchSnapshot('legacy string');
        expect(render('chair', '1', { objectData: { getLegacyString: () => '' }, state: 3 }, loaded)).toMatchSnapshot('empty legacy string');
    });

    it('steps the visualization once, and once more for each frame asked for', () =>
    {
        const loaded = { loaded: true };

        expect(render('chair', '1', { frameCount: 0 }, loaded)).toMatchSnapshot('frames 0');
        expect(render('chair', '1', { frameCount: 3 }, loaded)).toMatchSnapshot('frames 3');
        expect(render('chair', '1', { frameCount: 1, scale: 32 }, loaded)).toMatchSnapshot('scale 32');
    });

    it('keeps the listener and the object while the content is loading', () =>
    {
        expect(render('chair', '1', { listener: true }, { loaded: false })).toMatchSnapshot('listener');
        expect(render('chair', '1', { listener: true }, { loaded: false, useCache: false })).toMatchSnapshot('listener, uncached');
        expect(render('chair', '1', { listener: true, objectData: new LegacyDataType() }, { loaded: false })).toMatchSnapshot('listener, legacy data');
        expect(render('chair', '1', { listener: false }, { loaded: false })).toMatchSnapshot('no listener, not loaded');
    });

    it('frees the object and stores the image when the content is there', () =>
    {
        expect(render('chair', '1', {}, { loaded: true })).toMatchSnapshot('stored');
        expect(render('chair', '1', {}, { loaded: true, useCache: false })).toMatchSnapshot('not stored');
        expect(render('chair', '1', { objectData: { getLegacyString: () => 'a' } }, { loaded: true })).toMatchSnapshot('not stored, other data');
        expect(render('chair', '1', {}, { loaded: true, noTexture: true })).toMatchSnapshot('no texture');
        expect(render('chair', '1', {}, { loaded: true, cached: true })).toMatchSnapshot('second call served from the cache');
    });

    it('gives up early when something is missing', () =>
    {
        expect(render('chair', '1', {}, { noManager: true })).toMatchSnapshot('no manager');
        expect(render('', '1', {}, { loaded: true })).toMatchSnapshot('no type');
        expect(render('chair', '1', {}, { noInstance: true })).toMatchSnapshot('no instance');
        expect(render('chair', '1', {}, { noIds: true })).toMatchSnapshot('no id');
        expect(render('chair', '1', {}, { noObject: true })).toMatchSnapshot('no object');
        expect(render('chair', '1', {}, { noModel: true })).toMatchSnapshot('no model');
        expect(render('chair', '1', {}, { noLogic: true })).toMatchSnapshot('no logic');
        expect(render('chair', '1', {}, { noVisualization: true })).toMatchSnapshot('no visualization');
    });
});
