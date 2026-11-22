import { MouseEventType, RoomObjectOperationType } from '@octane/api';
import { describe, expect, it, vi } from 'vitest';
import { RoomEngine } from './RoomEngine';
import { RoomAreaSelectionManager } from './utils/RoomAreaSelectionManager';
import { RoomInstanceData } from './utils/RoomInstanceData';

vi.mock('./GetRoomMessageHandler', () => ({
    GetRoomMessageHandler: () => ({})
}));

vi.mock('./GetRoomEngine', () => ({
    GetRoomEngine: () => null
}));

/**
 * The state machine behind dragging the room with the mouse: what a press, a move, a release and a click do to the
 * dragging state, when the click that ends a drag is swallowed, and what a release does to the camera. The state
 * after each event is pinned, so the method that holds it can be taken apart without changing a case.
 */

const ROOM_ID = 3;

interface Options
{
    selected?: string;
    selecting?: boolean;
    allowsDragging?: boolean;
    alwaysCenters?: boolean;
    decorating?: boolean;
    flipped?: boolean;
    cameraMoving?: boolean;
}

type Step = [ type: string, x: number, y: number, modifiers?: { alt?: boolean; ctrl?: boolean; shift?: boolean } ];

const play = (steps: Step[], options: Options = {}) =>
{
    const instanceData = new RoomInstanceData(ROOM_ID);
    const camera = instanceData.roomCamera;
    const calls: string[] = [];

    camera.centeredLocX = true;
    camera.centeredLocY = true;

    Object.defineProperty(camera, 'isMoving', { get: () => !!options.cameraMoving });

    const resetLocation = camera.resetLocation.bind(camera);

    camera.resetLocation = (location) =>
    {
        calls.push(`resetLocation ${location.x},${location.y}`);
        resetLocation(location);
    };

    const reset = camera.reset.bind(camera);

    camera.reset = () =>
    {
        calls.push('reset');
        reset();
    };

    const canvas = { isFlipped: !!options.flipped, screenOffsetX: -40, screenOffsetY: 25 } as never;
    const engine = Object.create(RoomEngine.prototype);

    Object.assign(engine, {
        _activeRoomId: ROOM_ID,
        _activeRoomActiveCanvasMouseX: 0,
        _activeRoomActiveCanvasMouseY: 0,
        _activeRoomIsDragged: false,
        _activeRoomWasDragged: false,
        _activeRoomDragStartX: 0,
        _activeRoomDragStartY: 0,
        _activeRoomDragX: 0,
        _activeRoomDragY: 0,
        _roomAllowsDragging: options.allowsDragging ?? true,
        _roomDraggingAlwaysCenters: !!options.alwaysCenters,
        _roomInstanceDatas: new Map([[ ROOM_ID, instanceData ]]),
        _areaSelectionManager: { areaSelectionState: options.selecting ? RoomAreaSelectionManager.SELECTING : RoomAreaSelectionManager.NOT_SELECTING_AREA },
        _roomSessionManager: { getSession: () => ({ isDecorating: !!options.decorating }) },
        getSelectedRoomObjectData: () => (options.selected === undefined ? null : { operation: options.selected })
    });

    return steps.map(([ type, x, y, modifiers ]) =>
    {
        const result = engine.handleRoomDragging(canvas, x, y, type, !!modifiers?.alt, !!modifiers?.ctrl, !!modifiers?.shift);

        // the engine remembers the mouse after the dragging has seen it
        engine._activeRoomActiveCanvasMouseX = x;
        engine._activeRoomActiveCanvasMouseY = y;

        return JSON.stringify({
            event: `${type} ${x},${y}`,
            returned: result,
            dragged: engine._activeRoomIsDragged,
            wasDragged: engine._activeRoomWasDragged,
            start: [ engine._activeRoomDragStartX, engine._activeRoomDragStartY ],
            drag: [ engine._activeRoomDragX, engine._activeRoomDragY ],
            centered: [ camera.centeredLocX, camera.centeredLocY ],
            camera: calls.splice(0)
        });
    });
};

const DOWN = MouseEventType.MOUSE_DOWN;
const UP = MouseEventType.MOUSE_UP;
const MOVE = MouseEventType.MOUSE_MOVE;
const CLICK = MouseEventType.MOUSE_CLICK;

describe('RoomEngine room dragging', () =>
{
    it('starts a drag on a press, and ignores moves until the threshold is passed', () =>
    {
        expect(play([[ MOVE, 100, 100 ], [ DOWN, 100, 100 ], [ MOVE, 105, 103 ], [ MOVE, 110, 108 ], [ UP, 110, 108 ], [ CLICK, 110, 108 ]])).toMatchSnapshot();
    });

    it('turns a drag past the threshold into a camera move, and swallows the click that ends it', () =>
    {
        expect(play([[ DOWN, 100, 100 ], [ MOVE, 130, 100 ], [ MOVE, 150, 120 ], [ MOVE, 150, 120 ], [ UP, 150, 120 ], [ CLICK, 150, 120 ], [ CLICK, 150, 120 ]])).toMatchSnapshot();
    });

    it('treats a move on any side of the threshold as a drag', () =>
    {
        for(const [ dx, dy ] of [ [ 15, 0 ], [ -15, 0 ], [ 0, 15 ], [ 0, -15 ], [ 14, 14 ], [ -14, -14 ] ])
        {
            expect(play([[ DOWN, 200, 200 ], [ MOVE, 200 + dx, 200 + dy ]])).toMatchSnapshot(`move ${dx},${dy}`);
        }
    });

    it('does not start a drag with a modifier key, while decorating, or when the room forbids it', () =>
    {
        expect(play([[ DOWN, 10, 10, { alt: true } ], [ MOVE, 90, 90 ]])).toMatchSnapshot('alt');
        expect(play([[ DOWN, 10, 10, { ctrl: true } ], [ MOVE, 90, 90 ]])).toMatchSnapshot('ctrl');
        expect(play([[ DOWN, 10, 10, { shift: true } ], [ MOVE, 90, 90 ]])).toMatchSnapshot('shift');
        expect(play([[ DOWN, 10, 10 ], [ MOVE, 90, 90 ]], { decorating: true })).toMatchSnapshot('decorating');
        expect(play([[ DOWN, 10, 10 ], [ MOVE, 90, 90 ]], { allowsDragging: false })).toMatchSnapshot('not allowed');
    });

    it('sets the camera where the drag ended, unless the canvas is flipped, and can centre it again', () =>
    {
        const drag: Step[] = [[ DOWN, 0, 0 ], [ MOVE, 40, 0 ], [ MOVE, 60, 30 ], [ UP, 60, 30 ]];

        expect(play(drag)).toMatchSnapshot('plain');
        expect(play(drag, { cameraMoving: true })).toMatchSnapshot('camera moving');
        expect(play(drag, { flipped: true })).toMatchSnapshot('flipped');
        expect(play(drag, { alwaysCenters: true })).toMatchSnapshot('always centres');
        expect(play(drag, { alwaysCenters: true, flipped: true })).toMatchSnapshot('always centres, flipped');
    });

    it('leaves the camera alone when the button is released without a drag', () =>
    {
        expect(play([[ DOWN, 0, 0 ], [ UP, 0, 0 ]], { alwaysCenters: true })).toMatchSnapshot();
        expect(play([[ UP, 0, 0 ]])).toMatchSnapshot('release without a press');
    });

    it('stops a drag when an object is being placed or moved, or an area is being selected', () =>
    {
        for(const operation of [ RoomObjectOperationType.OBJECT_PLACE, RoomObjectOperationType.OBJECT_MOVE, RoomObjectOperationType.OBJECT_MOVE_TO ])
        {
            expect(play([[ DOWN, 0, 0 ], [ MOVE, 50, 50 ]], { selected: operation })).toMatchSnapshot(`operation ${operation}`);
        }

        expect(play([[ DOWN, 0, 0 ], [ MOVE, 50, 50 ]], { selected: RoomObjectOperationType.OBJECT_UNDEFINED })).toMatchSnapshot('another operation');
        expect(play([[ DOWN, 0, 0 ], [ MOVE, 50, 50 ]], { selecting: true })).toMatchSnapshot('selecting an area');
    });

    it('ends a drag on a double click and ignores unknown events', () =>
    {
        expect(play([[ DOWN, 0, 0 ], [ MOVE, 40, 0 ], [ MouseEventType.DOUBLE_CLICK, 40, 0 ], [ CLICK, 40, 0 ]])).toMatchSnapshot('double click');
        expect(play([[ DOWN, 0, 0 ], [ 'mouse_other', 40, 0 ]])).toMatchSnapshot('unknown event');
    });
});
