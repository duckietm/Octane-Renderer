import { describe, expect, it, vi } from 'vitest';
import { RoomEngine } from './RoomEngine';

vi.mock('./GetRoomMessageHandler', () => ({
    GetRoomMessageHandler: () => ({})
}));

vi.mock('./GetRoomEngine', () => ({
    GetRoomEngine: () => null
}));

const settings = vi.hoisted(() => ({ values: {} }));

vi.mock('@octane/configuration', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    GetConfiguration: () => ({ getValue: (key: string, fallback: unknown) => (key in settings.values ? settings.values[key] : fallback) })
}));

/**
 * What a room instance is given when it is created: the variables of its model, the seed of the room object, the
 * surface types and the doors sent to the room logic, and the cursor objects. Everything the instance, the room
 * object and the logic receive is recorded in order, so the method that does it can be taken apart.
 */

const ROOM_ID = 5;

const describeMessage = (message: unknown) => `${(message as object).constructor.name} ${JSON.stringify(message)}`;

interface Options
{
    roomMap?: unknown;
    noRoomObject?: boolean;
    noLogic?: boolean;
    noInstance?: boolean;
    noManager?: boolean;
    arrow?: boolean;
}

const run = (floor: string, wall: string, landscape: string, options: Options = {}) =>
{
    settings.values = { 'enable.avatar.arrow': !!options.arrow };

    const log: string[] = [];
    const record = (target: string, entries: Map<string, unknown>) => ({
        setValue: (key: string, value: unknown) =>
        {
            entries.set(key, value);
            log.push(`${target}.setValue ${key} ${JSON.stringify(value)}`);
        }
    });
    const model = new Map<string, unknown>();
    const objectModel = new Map<string, unknown>();
    const logic = options.noLogic ? null : {
        initialize: (map: unknown) => log.push(`logic.initialize ${JSON.stringify(map)}`),
        processUpdateMessage: (message: unknown) => log.push(`logic.process ${describeMessage(message)}`)
    };
    const roomObject = options.noRoomObject ? null : { model: record('object', objectModel), logic };
    const instance = {
        model: record('instance', model),
        createRoomObjectAndInitalize: (id: number, type: string, category: number) =>
        {
            log.push(`create ${id} ${type} ${category}`);

            return id === RoomEngine.ROOM_OBJECT_ID ? roomObject : { id };
        }
    };
    const engine = Object.create(RoomEngine.prototype);

    Object.assign(engine, {
        _roomManager: options.noManager ? null : { createRoomInstance: (id: number) => (options.noInstance ? null : (log.push(`createRoomInstance ${id}`), instance)) },
        getRoomId: (id: number) => `room_${id}`
    });

    const result = engine.setupRoomInstance(ROOM_ID, options.roomMap, floor, wall, landscape, 'model_a');

    return { returned: result === instance ? 'instance' : result, log };
};

const door = (x: number, y: number, z: number, dir: number) => ({ x, y, z, dir });
const map = (doors: unknown[], dimensions: unknown = { minX: 1, maxX: 12, minY: 2, maxY: 9 }) => ({ dimensions, doors });

describe('RoomEngine room instance setup', () =>
{
    it('creates the room object, the model defaults and the cursor', () =>
    {
        expect(run('', '', '', { roomMap: map([]) })).toMatchSnapshot();
    });

    it('stores the bounds and a seed made from them', () =>
    {
        expect(run('', '', '', { roomMap: map([], { minX: 0, maxX: 30, minY: 4, maxY: 28 }) })).toMatchSnapshot('bounds');
        expect(run('', '', '', { roomMap: map([], { minX: -3, maxX: 7, minY: -1, maxY: 5 }) })).toMatchSnapshot('negative bounds');
        expect(run('', '', '', { roomMap: { dimensions: null, doors: [] } })).toMatchSnapshot('no dimensions');
        expect(run('', '', '', { roomMap: null })).toMatchSnapshot('no map');
    });

    it('sends the floor, wall and landscape types it was given, each only when set', () =>
    {
        expect(run('101', '202', '303', { roomMap: map([]) })).toMatchSnapshot('all three');
        expect(run('101', '', '', { roomMap: map([]) })).toMatchSnapshot('floor only');
        expect(run('', '202', '', { roomMap: map([]) })).toMatchSnapshot('wall only');
        expect(run('', '', '303', { roomMap: map([]) })).toMatchSnapshot('landscape only');
    });

    it('masks every door and publishes the position of the ones facing 90 or 180', () =>
    {
        expect(run('', '', '', { roomMap: map([ door(3, 4, 1, 90) ]) })).toMatchSnapshot('door 90');
        expect(run('', '', '', { roomMap: map([ door(3, 4, 1, 180) ]) })).toMatchSnapshot('door 180');
        expect(run('', '', '', { roomMap: map([ door(3, 4, 1, 0) ]) })).toMatchSnapshot('door 0');
        expect(run('', '', '', { roomMap: map([ door(1, 1, 0, 90), null, door(2, 6, 2, 180), door(5, 5, 0, 270) ]) })).toMatchSnapshot('several doors');
    });

    it('adds the avatar arrow when the configuration asks for it', () =>
    {
        expect(run('', '', '', { roomMap: map([]), arrow: true })).toMatchSnapshot('arrow');
    });

    it('survives a room object without logic when there are no doors', () =>
    {
        expect(run('101', '202', '303', { roomMap: map([]), noLogic: true })).toMatchSnapshot('no logic');
        expect(run('', '', '', { roomMap: map([]), noRoomObject: true })).toMatchSnapshot('no room object');
    });

    it('returns early without a manager or an instance', () =>
    {
        expect(run('', '', '', { noManager: true })).toMatchSnapshot('no manager');
        expect(run('', '', '', { noInstance: true })).toMatchSnapshot('no instance');
    });
});
