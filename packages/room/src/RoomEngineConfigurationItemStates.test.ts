import { RoomObjectCategory, RoomObjectVariable } from '@octane/api';
import { describe, expect, it, vi } from 'vitest';
import { RoomEngine } from './RoomEngine';
import { RoomMessageHandler } from './RoomMessageHandler';
import { RoomVariableEnum } from './RoomVariableEnum';

vi.mock('./GetRoomMessageHandler', () => ({
    GetRoomMessageHandler: () => ({})
}));

vi.mock('./GetRoomEngine', () => ({
    GetRoomEngine: () => null
}));

const ROOM_ID = 9;

const createModel = () =>
{
    const values = new Map<string, number>();

    return { values, getValue: (key: string) => values.get(key), setValue: (key: string, value: number) => values.set(key, value) };
};

const createEngine = (objects: Record<number, { model: ReturnType<typeof createModel> }[]> = {}) =>
{
    const roomModel = createModel();
    const instance = { model: roomModel };
    const engine = Object.create(RoomEngine.prototype) as RoomEngine;

    Object.assign(engine, {
        _activeRoomId: ROOM_ID,
        getRoomInstance: (roomId: number) => ((roomId === ROOM_ID) ? instance : null),
        getRoomObjects: (roomId: number, category: number) => ((roomId === ROOM_ID) ? (objects[category] ?? []) : [])
    });

    return { engine, roomModel };
};

describe('RoomEngine ConfigurationItemStates flags (AIR room engine setters)', () =>
{
    it('stores the handitem control block and reads it for the active room', () =>
    {
        const { engine, roomModel } = createEngine();

        expect(engine.activeRoomHasHanditemControlBlocked).toBe(false);

        engine.setHanditemControlBlocked(ROOM_ID, true);

        expect(roomModel.values.get(RoomVariableEnum.HANDITEM_CONTROL_BLOCKED)).toBe(1);
        expect(engine.activeRoomHasHanditemControlBlocked).toBe(true);

        engine.setHanditemControlBlocked(ROOM_ID, false);

        expect(engine.activeRoomHasHanditemControlBlocked).toBe(false);
    });

    it('stores the free furni movements mode and reads it for the active room', () =>
    {
        const { engine, roomModel } = createEngine();

        expect(engine.activeRoomHasFreeFurniMovementsMode).toBe(false);

        engine.setFreeFurniMovementsMode(ROOM_ID, true);

        expect(roomModel.values.get(RoomVariableEnum.FREE_FURNI_MOVEMENTS_MODE)).toBe(1);
        expect(engine.activeRoomHasFreeFurniMovementsMode).toBe(true);
    });

    it('marks every floor and wall furni with the invisible layer state', () =>
    {
        const floor = { model: createModel() };
        const wall = { model: createModel() };
        const { engine, roomModel } = createEngine({ [RoomObjectCategory.FLOOR]: [ floor ], [RoomObjectCategory.WALL]: [ wall ] });

        engine.setInvisibleFurni(ROOM_ID, true);

        expect(roomModel.values.get(RoomVariableEnum.INVISIBLE_FURNI)).toBe(1);
        expect(floor.model.values.get(RoomObjectVariable.FURNITURE_INVISIBLE_LAYER)).toBe(1);
        expect(wall.model.values.get(RoomObjectVariable.FURNITURE_INVISIBLE_LAYER)).toBe(1);

        engine.setInvisibleFurni(ROOM_ID, false);

        expect(floor.model.values.get(RoomObjectVariable.FURNITURE_INVISIBLE_LAYER)).toBe(0);
        expect(wall.model.values.get(RoomObjectVariable.FURNITURE_INVISIBLE_LAYER)).toBe(0);
    });

    it('gives furni created later the room invisible state (AIR createObjectFurniture / createObjectWallItem)', () =>
    {
        const { engine } = createEngine();
        const created = { model: createModel() };

        Object.assign(engine, { createRoomObjectAndInitialize: () => created });

        engine.setInvisibleFurni(ROOM_ID, true);
        engine.createRoomObjectFloor(ROOM_ID, 1, 'chair');

        expect(created.model.values.get(RoomObjectVariable.FURNITURE_INVISIBLE_LAYER)).toBe(1);

        engine.setInvisibleFurni(ROOM_ID, false);
        engine.createRoomObjectWall(ROOM_ID, 2, 'poster');

        expect(created.model.values.get(RoomObjectVariable.FURNITURE_INVISIBLE_LAYER)).toBe(0);
    });

    it('ignores rooms without an instance', () =>
    {
        const { engine } = createEngine();

        expect(() => engine.setHanditemControlBlocked(1, true)).not.toThrow();
        expect(() => engine.setFreeFurniMovementsMode(1, true)).not.toThrow();
        expect(() => engine.setInvisibleFurni(1, true)).not.toThrow();
        expect(engine.isRoomVariableActive(1, RoomVariableEnum.INVISIBLE_FURNI)).toBe(false);
    });

    it('forwards all four packet flags to the room engine (AIR onConfigurationItemStates)', () =>
    {
        const roomEngine = { setHanditemControlBlocked: vi.fn(), setChooserDisabled: vi.fn(), setFreeFurniMovementsMode: vi.fn(), setInvisibleFurni: vi.fn() };
        const handler = Object.create(RoomMessageHandler.prototype) as RoomMessageHandler;

        Object.assign(handler, { _roomEngine: roomEngine, _currentRoomId: ROOM_ID });

        (handler as unknown as { onConfigurationItemStatesEvent: (event: unknown) => void }).onConfigurationItemStatesEvent({
            getParser: () => ({ isHanditemControlBlocked: true, chooserDisabled: false, freeFurniMovementsEnabled: true, invisibleFurni: true })
        });

        expect(roomEngine.setHanditemControlBlocked).toHaveBeenCalledWith(ROOM_ID, true);
        expect(roomEngine.setChooserDisabled).toHaveBeenCalledWith(ROOM_ID, false);
        expect(roomEngine.setFreeFurniMovementsMode).toHaveBeenCalledWith(ROOM_ID, true);
        expect(roomEngine.setInvisibleFurni).toHaveBeenCalledWith(ROOM_ID, true);
    });
});
