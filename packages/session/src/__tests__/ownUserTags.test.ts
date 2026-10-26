import { beforeEach, describe, expect, it, vi } from 'vitest';

const room: { viewerSession: { ownRoomIndex: number } | null } = vi.hoisted(() => ({ viewerSession: { ownRoomIndex: 4 } }));

vi.mock('../GetRoomSessionManager', () => ({ GetRoomSessionManager: () => room }));

import { SessionDataManager } from '../SessionDataManager';

const tagsPacket = (roomUnitId: number, tags: string[]) => ({ connection: {}, getParser: () => ({ roomUnitId, tags }) });

/**
 * The server sends RoomUserTags for any unit - when another user's infostand opens, and to the whole room after a
 * wired tag effect - and every one of them used to become the user's own tags.
 */
describe('SessionDataManager own tags', () =>
{
    let manager: SessionDataManager;

    beforeEach(() =>
    {
        room.viewerSession = { ownRoomIndex: 4 };
        manager = new SessionDataManager();
    });

    const receive = (roomUnitId: number, tags: string[]) => (manager as unknown as { onUserTags(event: unknown): void }).onUserTags(tagsPacket(roomUnitId, tags));

    it('takes the tags of the user\'s own unit', () =>
    {
        receive(4, [ 'builder' ]);

        expect(manager.tags).toEqual([ 'builder' ]);
    });

    it('ignores the tags of another unit', () =>
    {
        receive(4, [ 'builder' ]);
        receive(9, [ 'someone else' ]);

        expect(manager.tags).toEqual([ 'builder' ]);
    });

    it('ignores tags while the user is in no room', () =>
    {
        room.viewerSession = null;

        receive(4, [ 'builder' ]);

        expect(manager.tags).not.toEqual([ 'builder' ]);
    });
});
