import { FurnitureFloorRemoveEvent } from '@octane/communication';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import './RoomEngine';
import { RoomMessageHandler } from './RoomMessageHandler';

vi.mock('./GetRoomMessageHandler', () => ({ GetRoomMessageHandler: () => ({}) }));
vi.mock('./GetRoomEngine', () => ({ GetRoomEngine: () => null }));

const fixture = () =>
{
    const engine = {
        removeRoomObjectFloor: vi.fn(),
        refreshTileObjectMap: vi.fn(),
        updateAreaHide: vi.fn(),
        destroyRoom: vi.fn(),
        getRoomObjects: (): unknown[] => []
    };
    const handler = Object.create(RoomMessageHandler.prototype) as RoomMessageHandler;

    Object.assign(handler, {
        _roomEngine: engine,
        _currentRoomId: 5,
        _pendingWiredEffects: new Map(),
        _activeWiredUserMovements: new Map(),
        _activeRoomUserWalks: new Map(),
        _jumpingUnitIds: new Set<number>(),
        _walkingUnitIds: new Set<number>(),
        _roomUnitIndexByIdentity: new Map(),
        _activeConfInvisHiddenItemIds: new Set<number>(),
        _confInvisReapplyTimeouts: [],
        _areaHideReapplyTimeouts: [],
        _delayedFloorRemovals: new Set(),
        _activeAreaHideControllers: new Map()
    });

    const removeLater = (itemId: number, delay: number) =>
    {
        const event = Object.create(FurnitureFloorRemoveEvent.prototype) as FurnitureFloorRemoveEvent;

        Object.assign(event, { getParser: () => ({ itemId, delay, isExpired: false, userId: 1 }) });
        Object.defineProperty(event, 'connection', { value: {} });

        (handler as unknown as { onFurnitureFloorRemoveEvent: (event: FurnitureFloorRemoveEvent) => void }).onFurnitureFloorRemoveEvent(event);
    };

    return { engine, handler, removeLater };
};

describe('RoomMessageHandler delayed floor removal', () =>
{
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('removes the item from its room when the delay ends', () =>
    {
        const { engine, removeLater } = fixture();

        removeLater(41, 1500);
        vi.advanceTimersByTime(1500);

        expect(engine.removeRoomObjectFloor).toHaveBeenCalledWith(5, 41, 1, true);
    });

    it('does not remove an item of the same id in the room entered meanwhile', () =>
    {
        const { engine, handler, removeLater } = fixture();

        removeLater(41, 1500);
        handler.setRoomId(6);
        vi.advanceTimersByTime(1500);

        expect(engine.removeRoomObjectFloor).not.toHaveBeenCalled();
    });

    it('does nothing once the handler is disposed', () =>
    {
        const { engine, handler, removeLater } = fixture();

        removeLater(41, 1500);
        handler.clearRoomId();
        vi.advanceTimersByTime(1500);

        expect(engine.removeRoomObjectFloor).not.toHaveBeenCalled();
    });
});
