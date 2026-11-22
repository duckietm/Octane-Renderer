import { describe, expect, it, vi } from 'vitest';
import { RoomUserData } from './RoomUserData';
import { UserDataManager } from './UserDataManager';

vi.mock('@octane/communication', () => ({
    GetCommunication: () => ({ connection: { send: vi.fn() } }),
    RequestPetInfoComposer: class
    {},
    UserCurrentBadgesComposer: class
    {}
}));

describe('UserDataManager badges', () =>
{
    it('forgets a visitor\'s badges when they leave the room', () =>
    {
        const manager = new UserDataManager();
        const user = new RoomUserData(7);

        user.type = 1;
        user.webID = 42;
        manager.updateUserData(user);
        manager.setUserBadges(42, [ 'ADM' ]);

        manager.removeUserData(7);

        expect((manager as any)._userBadges.has(42)).toBe(false);
    });

    it('keeps the badges when the same user is sent again', () =>
    {
        const manager = new UserDataManager();
        const user = new RoomUserData(7);

        user.type = 1;
        user.webID = 42;
        manager.updateUserData(user);
        manager.setUserBadges(42, [ 'ADM' ]);

        manager.updateUserData(user);

        expect((manager as any)._userBadges.get(42)).toEqual([ 'ADM' ]);
    });
});
