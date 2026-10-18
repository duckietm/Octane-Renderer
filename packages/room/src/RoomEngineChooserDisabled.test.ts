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

describe('RoomEngine chooser disabled (AIR setChooserDisabled / activeRoomHasChooserDisabled)', () =>
{
    it('stores the ConfigurationItemStates chooser flag on the room instance', () =>
    {
        const values = new Map<string, number>();
        const instance = { model: { getValue: (key: string) => values.get(key), setValue: (key: string, value: number) => values.set(key, value) } };
        const engine = Object.create(RoomEngine.prototype) as RoomEngine;

        Object.assign(engine, { _activeRoomId: ROOM_ID, getRoomInstance: (roomId: number) => ((roomId === ROOM_ID) ? instance : null) });

        expect(engine.activeRoomHasChooserDisabled).toBe(false);

        engine.setChooserDisabled(ROOM_ID, true);

        expect(values.get(RoomVariableEnum.CHOOSER_DISABLED)).toBe(1);
        expect(engine.activeRoomHasChooserDisabled).toBe(true);

        engine.setChooserDisabled(ROOM_ID, false);

        expect(values.get(RoomVariableEnum.CHOOSER_DISABLED)).toBe(0);
        expect(engine.activeRoomHasChooserDisabled).toBe(false);
    });

    it('ignores rooms without an instance', () =>
    {
        const engine = Object.create(RoomEngine.prototype) as RoomEngine;

        Object.assign(engine, { _activeRoomId: ROOM_ID, getRoomInstance: (): null => null });

        expect(() => engine.setChooserDisabled(ROOM_ID, true)).not.toThrow();
        expect(engine.activeRoomHasChooserDisabled).toBe(false);
    });

    it('is fed by the ConfigurationItemStates packet (AIR onConfigurationItemStates)', () =>
    {
        const roomEngine = { setChooserDisabled: vi.fn(), setHanditemControlBlocked: vi.fn(), setFreeFurniMovementsMode: vi.fn(), setInvisibleFurni: vi.fn() };
        const handler = Object.create(RoomMessageHandler.prototype) as RoomMessageHandler;
        const dispatch = (chooserDisabled: boolean) => (handler as unknown as { onConfigurationItemStatesEvent: (event: unknown) => void })
            .onConfigurationItemStatesEvent({ getParser: () => ({ chooserDisabled }) });

        Object.assign(handler, { _roomEngine: roomEngine, _currentRoomId: ROOM_ID });

        dispatch(true);
        expect(roomEngine.setChooserDisabled).toHaveBeenLastCalledWith(ROOM_ID, true);

        dispatch(false);
        expect(roomEngine.setChooserDisabled).toHaveBeenLastCalledWith(ROOM_ID, false);
    });
});
