import { OctaneEventType } from '@octane/events';
import { describe, expect, it } from 'vitest';
import { shouldAttemptRoomReEntry } from './reconnectRoomPolicy';

describe('shouldAttemptRoomReEntry', () =>
{
    it('waits for reauthentication before restoring the room', () =>
    {
        expect(shouldAttemptRoomReEntry(OctaneEventType.SOCKET_RECONNECTED)).toBe(false);
        expect(shouldAttemptRoomReEntry(OctaneEventType.SOCKET_REAUTHENTICATED)).toBe(true);
    });

    it('keeps the existing room session when Polaris resumed that same room in place', () =>
    {
        expect(shouldAttemptRoomReEntry(
            OctaneEventType.SOCKET_REAUTHENTICATED,
            { sessionResumed: true, roomId: 42 },
            42)).toBe(false);
    });

    it('falls back to room re-entry for old emulators without resume metadata', () =>
    {
        expect(shouldAttemptRoomReEntry(
            OctaneEventType.SOCKET_REAUTHENTICATED,
            { sessionResumed: false, roomId: 0 },
            42)).toBe(true);
    });
});
