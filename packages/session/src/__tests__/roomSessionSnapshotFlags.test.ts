import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RoomSession } from '../RoomSession';
import { RoomSessionManager } from '../RoomSessionManager';

/**
 * isSpectator and isDecorating are part of the room session snapshot but changed without refreshing it, so widgets
 * read the old spectator or decorating state until another change happened to invalidate the snapshot.
 */
describe('room session snapshot', () =>
{
    const sessionOf = (manager: RoomSessionManager) =>
    {
        manager.createSession(12);

        return manager.viewerSession as RoomSession;
    };

    it('shows decorating as soon as it is switched on', () =>
    {
        const manager = new RoomSessionManager();
        const session = sessionOf(manager);

        expect(manager.getActiveRoomSessionSnapshot().isDecorating).toBe(false);

        session.isDecorating = true;

        expect(manager.getActiveRoomSessionSnapshot().isDecorating).toBe(true);
    });

    it('shows spectator mode as soon as it is set', () =>
    {
        const manager = new RoomSessionManager();
        const session = sessionOf(manager);

        expect(manager.getActiveRoomSessionSnapshot().isSpectator).toBe(false);

        session.isSpectator = true;

        expect(manager.getActiveRoomSessionSnapshot().isSpectator).toBe(true);
    });

    it('keeps the same snapshot when the value does not change', () =>
    {
        const manager = new RoomSessionManager();
        const session = sessionOf(manager);
        const before = manager.getActiveRoomSessionSnapshot();

        session.isDecorating = false;

        expect(manager.getActiveRoomSessionSnapshot()).toBe(before);
    });

    it('does not import the session manager, which loads RoomSession first', () =>
    {
        expect(readFileSync('packages/session/src/RoomSession.ts', 'utf8')).not.toContain('GetRoomSessionManager');
    });
});
