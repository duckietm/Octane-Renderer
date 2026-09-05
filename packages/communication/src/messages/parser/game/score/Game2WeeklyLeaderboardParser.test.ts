import { IMessageDataWrapper } from '@octane/api';
import { describe, expect, it } from 'vitest';
import { Game2WeeklyLeaderboardParser } from './Game2WeeklyLeaderboardParser';

describe('Game2WeeklyLeaderboardParser', () =>
{
    it('reads the complete AIR metadata, entries and list footer', () =>
    {
        const values = [ 2026, 31, 2, 0, 345, 1, 7, 120, 3, 'object1', 'hd-180-1', 'M', 19, 0 ];
        let index = 0;
        const wrapper = {
            readInt: () => values[index++] as number,
            readString: () => values[index++] as string,
        } as IMessageDataWrapper;
        const parser = new Game2WeeklyLeaderboardParser();

        expect(parser.parse(wrapper)).toBe(true);
        expect(parser.year).toBe(2026);
        expect(parser.week).toBe(31);
        expect(parser.maxOffset).toBe(2);
        expect(parser.minutesUntilReset).toBe(345);
        expect(parser.totalListSize).toBe(19);
        expect(parser.gameTypeId).toBe(0);
        expect(parser.leaderboard.map(entry => [ entry.userId, entry.score, entry.rank, entry.name ]))
            .toEqual([[ 7, 120, 3, 'object1' ]]);
    });
});
