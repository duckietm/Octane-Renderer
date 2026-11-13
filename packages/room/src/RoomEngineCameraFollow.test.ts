import { Vector3d } from '@octane/utils';
import { Point, Rectangle } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { RoomEngine } from './RoomEngine';
import { RoomVariableEnum } from './RoomVariableEnum';
import { RoomGeometry, RoomInstanceData } from './utils';

vi.mock('./GetRoomMessageHandler', () => ({
    GetRoomMessageHandler: () => ({})
}));

vi.mock('./GetRoomEngine', () => ({
    GetRoomEngine: () => null
}));

/**
 * What the camera does when it follows an object: where it aims, which edges of the room hold it back or centre it,
 * and how it moves the canvas. The numbers are pinned as snapshots for a few rooms and canvases, so the long method
 * that computes them can be taken apart without moving the camera.
 */

const ROOM_ID = 7;

const round = (value: number) => Math.round(value * 1e6) / 1e6;

const vector = (value: { x: number; y: number; z: number } | null | undefined) => (value ? [ round(value.x), round(value.y), round(value.z) ] : null);

interface Scenario
{
    canvas: [ number, number ];
    bounds: [ number, number, number, number ] | null;
    room: [ number, number, number, number ];
    offset?: [ number, number ];
    direction?: number;
    followDisabled?: boolean;
}

const run = (scenario: Scenario, steps: { target: [ number, number, number ]; time: number }[]) =>
{
    const geometry = new RoomGeometry(64, new Vector3d(scenario.direction ?? 45, 30, 0), new Vector3d(5, 5, 0));
    const adjusted: unknown[] = [];
    const original = geometry.adjustLocation.bind(geometry);

    geometry.adjustLocation = (location, offset) =>
    {
        adjusted.push([ vector(location), offset ]);
        original(location, offset);
    };

    const canvas = { scale: 1, isFlipped: false, geometry, screenOffsetX: scenario.offset?.[0] ?? 0, screenOffsetY: scenario.offset?.[1] ?? 0 };
    const instanceData = new RoomInstanceData(ROOM_ID);
    const camera = instanceData.roomCamera;
    const offsets: unknown[] = [];
    const model = new Map<string, number>([
        [ RoomVariableEnum.ROOM_MIN_X, scenario.room[0] ],
        [ RoomVariableEnum.ROOM_MIN_Y, scenario.room[1] ],
        [ RoomVariableEnum.ROOM_MAX_X, scenario.room[2] ],
        [ RoomVariableEnum.ROOM_MAX_Y, scenario.room[3] ]
    ]);
    const engine = Object.create(RoomEngine.prototype);

    Object.assign(engine, {
        _roomInstanceDatas: new Map([[ ROOM_ID, instanceData ]]),
        _activeRoomId: ROOM_ID,
        _sessionDataManager: { isCameraFollowDisabled: !!scenario.followDisabled },
        getRoomInstanceRenderingCanvas: () => canvas,
        getRoomInstance: () => ({ model: { getValue: (key: string) => model.get(key) } }),
        getRoomCanvasRectangle: () => new Rectangle(0, 0, scenario.canvas[0], scenario.canvas[1]),
        getCanvasBoundingRectangle: () => (scenario.bounds ? new Rectangle(...scenario.bounds) : null),
        setRoomInstanceRenderingCanvasOffset: (_room: number, _canvas: number, point: Point) => offsets.push([ round(point.x), round(point.y) ])
    });

    const results = steps.map(({ target, time }) =>
    {
        engine.updateRoomCamera(ROOM_ID, 1, new Vector3d(...target), time);

        return {
            target: vector(camera.target),
            location: vector(camera.location),
            targetObject: vector(camera.targetObjectLoc),
            limited: [ camera.limitedLocationX, camera.limitedLocationY ],
            centered: [ camera.centeredLocX, camera.centeredLocY ],
            screen: [ camera.screenWd, camera.screenHt, camera.scale, camera.roomWd, camera.roomHt ],
            geometryLocation: vector(geometry.location),
            adjusted: adjusted.splice(0).map((item) => JSON.stringify(item)),
            offsets: offsets.splice(0).map((item) => JSON.stringify(item))
        };
    });

    return results.map((result) => JSON.stringify(result));
};

const follow = (target: [ number, number, number ]): { target: [ number, number, number ]; time: number }[] => [
    { target, time: 0 },
    { target, time: 16 },
    { target: [ target[0] + 1, target[1], target[2] ], time: 32 },
    { target: [ target[0] + 1, target[1] + 2, target[2] ], time: 600 }
];

describe('RoomEngine camera follow', () =>
{
    it('follows an object inside a room larger than the canvas', () =>
    {
        expect(run({ canvas: [ 800, 600 ], bounds: [ -900, -500, 2400, 1500 ], room: [ 0, 0, 30, 30 ] }, follow([ 12, 14, 0 ]))).toMatchSnapshot();
    });

    it('is held back at the edge of a large room', () =>
    {
        expect(run({ canvas: [ 800, 600 ], bounds: [ -900, -500, 2400, 1500 ], room: [ 0, 0, 30, 30 ] }, follow([ 1, 1, 0 ]))).toMatchSnapshot('near the corner');
        expect(run({ canvas: [ 800, 600 ], bounds: [ -900, -500, 2400, 1500 ], room: [ 0, 0, 30, 30 ] }, follow([ 30, 30, 3 ]))).toMatchSnapshot('far corner');
    });

    it('is held back at every corner of a large room, in two room directions', () =>
    {
        const corners: [ number, number, number ][] = [ [ 0, 0, 0 ], [ 30, 0, 0 ], [ 0, 30, 0 ], [ 30, 30, 0 ], [ 15, 0, 0 ], [ 0, 15, 0 ] ];

        for(const direction of [ 45, 225 ])
        {
            expect(corners.map((corner) => run({ canvas: [ 500, 400 ], bounds: [ -700, -300, 1400, 900 ], room: [ 0, 0, 30, 30 ], direction }, [ { target: corner, time: 0 }, { target: corner, time: 700 } ]))).toMatchSnapshot(`corners, direction ${direction}`);
        }
    });

    it('centres a room that is smaller than the canvas', () =>
    {
        expect(run({ canvas: [ 1600, 1200 ], bounds: [ -150, -100, 400, 300 ], room: [ 0, 0, 6, 6 ] }, follow([ 3, 3, 0 ]))).toMatchSnapshot();
    });

    it('centres one axis and holds the other when the room is wide but short', () =>
    {
        expect(run({ canvas: [ 800, 900 ], bounds: [ -1200, -100, 2600, 500 ], room: [ 0, 0, 40, 6 ] }, follow([ 20, 3, 0 ]))).toMatchSnapshot();
    });

    it('follows with the canvas dragged and with other room directions', () =>
    {
        expect(run({ canvas: [ 800, 600 ], bounds: [ -900, -500, 2400, 1500 ], room: [ 0, 0, 30, 30 ], offset: [ -120, 80 ] }, follow([ 10, 10, 0 ]))).toMatchSnapshot('dragged');
        expect(run({ canvas: [ 800, 600 ], bounds: [ -900, -500, 2400, 1500 ], room: [ 0, 0, 30, 30 ], direction: 135 }, follow([ 10, 20, 1 ]))).toMatchSnapshot('direction 135');
        expect(run({ canvas: [ 800, 600 ], bounds: [ -900, -500, 2400, 1500 ], room: [ 0, 0, 30, 30 ], direction: 225 }, follow([ 25, 5, 0 ]))).toMatchSnapshot('direction 225');
    });

    it('does not move the camera when following is disabled for the user', () =>
    {
        expect(run({ canvas: [ 800, 600 ], bounds: [ -900, -500, 2400, 1500 ], room: [ 0, 0, 30, 30 ], followDisabled: true }, follow([ 12, 14, 0 ]))).toMatchSnapshot();
    });

    it('resets when the room is off the canvas, and parks the geometry when there is nothing to follow', () =>
    {
        expect(run({ canvas: [ 800, 600 ], bounds: [ 3000, 2000, 400, 300 ], room: [ 0, 0, 30, 30 ] }, follow([ 12, 14, 0 ]))).toMatchSnapshot('room off the canvas');
        expect(run({ canvas: [ 800, 600 ], bounds: null, room: [ 0, 0, 30, 30 ] }, follow([ 12, 14, 0 ]))).toMatchSnapshot('no bounds');
        expect(run({ canvas: [ 800, 600 ], bounds: [ 0, 0, 1, 1 ], room: [ 0, 0, 30, 30 ] }, follow([ 12, 14, 0 ]))).toMatchSnapshot('empty bounds');
    });

    it('leaves a flipped or zoomed canvas alone', () =>
    {
        const geometry = new RoomGeometry(64, new Vector3d(45, 30, 0), new Vector3d(5, 5, 0));
        const instanceData = new RoomInstanceData(ROOM_ID);
        const engine = Object.create(RoomEngine.prototype);

        Object.assign(engine, {
            _roomInstanceDatas: new Map([[ ROOM_ID, instanceData ]]),
            getRoomInstanceRenderingCanvas: () => ({ scale: 1, isFlipped: true, geometry, screenOffsetX: 0, screenOffsetY: 0 })
        });

        const before = vector(instanceData.roomCamera.targetObjectLoc);

        engine.updateRoomCamera(ROOM_ID, 1, new Vector3d(4, 4, 0), 0);

        expect(vector(instanceData.roomCamera.targetObjectLoc)).toEqual(before);
        expect(instanceData.roomCamera.screenWd).toBe(0);
    });
});
