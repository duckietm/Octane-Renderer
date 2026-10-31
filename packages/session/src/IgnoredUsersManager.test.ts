import { describe, expect, it } from 'vitest';
import { IgnoredUsersManager } from './IgnoredUsersManager';

type Internals = { onIgnoreResultEvent(event: unknown): void; _ignoredUsers: number[] };

const result = (userId: number, value: number) => ({ getParser: () => ({ userId, result: value }) });

describe('IgnoredUsersManager full-list result', () =>
{
    it('drops the oldest entry only when the user was really added', () =>
    {
        const manager = new IgnoredUsersManager();
        const internals = manager as unknown as Internals;
        internals._ignoredUsers = [ 1, 2, 3 ];

        internals.onIgnoreResultEvent(result(2, 2));
        expect(internals._ignoredUsers).toEqual([ 1, 2, 3 ]);

        internals.onIgnoreResultEvent(result(4, 2));
        expect(internals._ignoredUsers).toEqual([ 2, 3, 4 ]);
        expect(manager.isIgnored(1)).toBe(false);
    });
});
