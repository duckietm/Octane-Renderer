import { describe, expect, it } from 'vitest';
import { GetModeratorUserRecordsMessageComposer } from '../GetModeratorUserRecordsMessageComposer';

describe('GetModeratorUserRecordsMessageComposer', () =>
{
    it('carries userId + kind', () =>
    {
        expect(new GetModeratorUserRecordsMessageComposer(42, 2).getMessageArray()).toEqual([ 42, 2 ]);
    });
});
