import { describe, expect, it } from 'vitest';
import { GetRoomSessionManager } from '../GetRoomSessionManager';
import { RoomSession } from '../RoomSession';

/**
 * isSpectator and isDecorating are part of the room session snapshot but changed without refreshing it, so widgets
 * read the old spectator or decorating state until another change happened to invalidate the snapshot.
 */
describe('room session snapshot', () =>
{
    const viewing = (session: RoomSession) =>
    {
        (GetRoomSessionManager() as unknown as { _viewerSession: RoomSession })._viewerSession = session;
        GetRoomSessionManager().invalidateRoomSessionSnapshot();
    };

    it('shows decorating as soon as it is switched on', () =>
    {
        const session = new RoomSession();

        viewing(session);
        expect(GetRoomSessionManager().getActiveRoomSessionSnapshot().isDecorating).toBe(false);

        session.isDecorating = true;

        expect(GetRoomSessionManager().getActiveRoomSessionSnapshot().isDecorating).toBe(true);
    });

    it('shows spectator mode as soon as it is set', () =>
    {
        const session = new RoomSession();

        viewing(session);
        expect(GetRoomSessionManager().getActiveRoomSessionSnapshot().isSpectator).toBe(false);

        session.isSpectator = true;

        expect(GetRoomSessionManager().getActiveRoomSessionSnapshot().isSpectator).toBe(true);
    });

    it('keeps the same snapshot when the value does not change', () =>
    {
        const session = new RoomSession();

        viewing(session);
        const before = GetRoomSessionManager().getActiveRoomSessionSnapshot();

        session.isDecorating = false;

        expect(GetRoomSessionManager().getActiveRoomSessionSnapshot()).toBe(before);

        viewing(null);
    });
});
