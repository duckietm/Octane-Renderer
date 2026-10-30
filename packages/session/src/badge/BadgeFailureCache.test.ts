import { describe, expect, it } from 'vitest';
import { BADGE_RETRY_MS, MAX_FAILED_BADGES, rememberFailedBadge, shouldRetryBadge } from './BadgeFailureCache';

describe('badge failure cache', () =>
{
    it('leaves a failed badge alone until the backoff has passed', () =>
    {
        const failed = new Map<string, number>();

        expect(shouldRetryBadge(failed, 'ACH_X1', 0)).toBe(true);

        rememberFailedBadge(failed, 'ACH_X1', 1_000);

        expect(shouldRetryBadge(failed, 'ACH_X1', 1_000 + BADGE_RETRY_MS - 1)).toBe(false);
        expect(shouldRetryBadge(failed, 'ACH_X1', 1_000 + BADGE_RETRY_MS)).toBe(true);
        expect(shouldRetryBadge(failed, 'ACH_Y1', 1_000)).toBe(true);
    });

    it('stays bounded', () =>
    {
        const failed = new Map<string, number>();

        for(let i = 0; i < MAX_FAILED_BADGES + 50; i++) rememberFailedBadge(failed, `B${ i }`, i);

        expect(failed.size).toBe(MAX_FAILED_BADGES);
        expect(failed.has('B0')).toBe(false);
        expect(failed.has(`B${ MAX_FAILED_BADGES + 49 }`)).toBe(true);
    });
});
