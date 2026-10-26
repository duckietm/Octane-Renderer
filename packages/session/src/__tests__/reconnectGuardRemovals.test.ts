import { beforeEach, describe, expect, it } from 'vitest';
import { RoomSessionHandler } from '../handler/RoomSessionHandler';
import { RoomSession } from '../RoomSession';
import { RoomSessionManager } from '../RoomSessionManager';

interface Internals
{
    _sessions: Map<string, RoomSession>;
    _viewerSession: RoomSession;
    _isReconnecting: boolean;
    endReconnectGuard(): void;
}

/**
 * While the reconnect guard was up, every removal and every server disconnect was dropped: a kick, an F5 into a room
 * one is banned from or a click on the hotel view in that window left a ghost room the server had already left.
 */
describe('removals during the reconnect guard', () =>
{
    let manager: RoomSessionManager;
    let internals: Internals;

    beforeEach(() =>
    {
        manager = new RoomSessionManager();
        internals = manager as unknown as Internals;

        const session = new RoomSession();

        session.roomId = 12;
        internals._sessions.set('hard_coded_room_id', session);
        internals._viewerSession = session;
        internals._isReconnecting = true;
    });

    it('applies a server disconnect when the guard ends', () =>
    {
        manager.sessionUpdate(12, RoomSessionHandler.RS_DISCONNECTED);
        expect(manager.getSession(12)).toBeTruthy();

        internals.endReconnectGuard();

        expect(manager.getSession(12)).toBeFalsy();
    });

    it('applies a refused entry - a room one is banned from - when the guard ends', () =>
    {
        manager.sessionUpdate(12, RoomSessionHandler.RS_REFUSED);
        internals.endReconnectGuard();

        expect(manager.getSession(12)).toBeFalsy();
    });

    it('drops a disconnect that came before the re-entry succeeded: it was the old connection going away', () =>
    {
        manager.sessionUpdate(12, RoomSessionHandler.RS_DISCONNECTED);
        manager.sessionUpdate(12, RoomSessionHandler.RS_READY);
        internals.endReconnectGuard();

        expect(manager.getSession(12)).toBeTruthy();
    });

    it('lets the user leave for the hotel view at once', () =>
    {
        manager.removeSession(-1);

        expect(manager.getSession(12)).toBeFalsy();
    });

    it('still holds back the quiet replacement of a session', () =>
    {
        manager.removeSession(12, false);

        expect(manager.getSession(12)).toBeTruthy();
    });

    it('ignores a refused entry outside a reconnect, which the navigator answers', () =>
    {
        internals._isReconnecting = false;

        manager.sessionUpdate(12, RoomSessionHandler.RS_REFUSED);

        expect(manager.getSession(12)).toBeTruthy();
    });
});
