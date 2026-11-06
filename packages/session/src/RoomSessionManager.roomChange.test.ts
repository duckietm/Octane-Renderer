import { RoomControllerLevel } from '@octane/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomSession } from './RoomSession';
import { RoomSessionManager } from './RoomSessionManager';

type ManagerState = { _lastRoomId: number; _lastRoomPassword: string };

describe('RoomSessionManager moving from one room to the next', () =>
{
    beforeEach(() =>
    {
        vi.useFakeTimers();
        vi.spyOn(RoomSession.prototype, 'start').mockReturnValue(true);
    });

    afterEach(() =>
    {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('keeps the room entered within five seconds of leaving another for the reconnect', () =>
    {
        const manager = new RoomSessionManager();
        const state = manager as unknown as ManagerState;

        manager.createSession(1);
        manager.removeSession(1, true);
        manager.createSession(2, 'secret');

        // The clear scheduled when room 1 was left used to fire now and forget room 2,
        // so a socket drop afterwards brought the user back to the hotel view.
        vi.advanceTimersByTime(5000);

        expect(state._lastRoomId).toBe(2);
        expect(state._lastRoomPassword).toBe('secret');
    });

    it('still forgets the room when nothing was entered after leaving it', () =>
    {
        const manager = new RoomSessionManager();
        const state = manager as unknown as ManagerState;

        manager.createSession(1);
        manager.removeSession(1, true);
        vi.advanceTimersByTime(5000);

        expect(state._lastRoomId).toBe(-1);
    });
});

describe('RoomSession.reset to another room', () =>
{
    it('drops the rights and the units of the previous room', () =>
    {
        const session = new RoomSession();
        const changed = vi.fn();

        session.roomId = 1;
        session.onSnapshotChange = changed;
        session.setRoomOwner();
        session.setControllerLevel(RoomControllerLevel.ROOM_OWNER);
        session.setOwnRoomIndex(3);
        session.isSpectator = true;

        session.reset(2);

        // A forward from an owned room kept the owner's tools in the next one: the server
        // sends the new rights but never a "not owner".
        expect(session.roomId).toBe(2);
        expect(session.isRoomOwner).toBe(false);
        expect(session.isSpectator).toBe(false);
        expect(session.controllerLevel).toBe(RoomControllerLevel.NONE);
        expect(session.ownRoomIndex).toBe(-1);
        expect(session.userDataManager.getRoomUserListSnapshot()).toHaveLength(0);
        expect(changed).toHaveBeenCalled();
    });

    it('keeps everything when it is the same room', () =>
    {
        const session = new RoomSession();

        session.roomId = 1;
        session.setRoomOwner();
        session.reset(1);

        expect(session.isRoomOwner).toBe(true);
    });
});
