import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionDataManager } from '../SessionDataManager';

type Internals = {
    _respectsLeft: number;
    send(composer: unknown): void;
    onRoomModelNameEvent(event: unknown): void;
    dropPendingRespects(): void;
};

const roomReady = (roomId: number) => ({ getParser: () => ({ roomId }) });

/**
 * A burst of respects is paced over several ticks. What was still queued when the socket closed or the room changed
 * stayed queued - sent later to a user in another room or on a dead connection - while its points stayed spent.
 */
describe('SessionDataManager pending respects', () =>
{
    let manager: Internals;
    let sent: unknown[];

    beforeEach(() =>
    {
        vi.useFakeTimers();

        sent = [];
        manager = new SessionDataManager() as unknown as Internals;
        manager._respectsLeft = 3;
        manager.send = composer => sent.push(composer);
    });

    afterEach(() => vi.useRealTimers());

    it('gives back the points of respects still queued when the room changes, and never sends them', () =>
    {
        const session = manager as unknown as SessionDataManager;

        session.giveRespect(10);
        session.giveRespect(10);
        session.giveRespect(10);

        expect(sent).toHaveLength(1);
        expect(manager._respectsLeft).toBe(0);

        manager.onRoomModelNameEvent(roomReady(5));
        vi.advanceTimersByTime(1000);

        expect(sent).toHaveLength(1);
        expect(manager._respectsLeft).toBe(2);
    });

    it('does nothing when no respect is queued', () =>
    {
        manager.dropPendingRespects();

        expect(manager._respectsLeft).toBe(3);
    });

    it('drops the queue when the socket closes or the room session ends', () =>
    {
        const source = readFileSync(join(__dirname, '..', 'SessionDataManager.ts'), 'utf8');

        expect(source).toContain('GetEventDispatcher().addEventListener(OctaneEventType.SOCKET_CLOSED, this._pendingRespectsDropCallback);');
        expect(source).toContain('GetEventDispatcher().addEventListener(RoomSessionEvent.ENDED, this._pendingRespectsDropCallback);');
    });
});
