import { describe, expect, it } from 'vitest';
import { WiredUserVariableUpdateComposer } from './WiredUserVariableUpdateComposer';

describe('WiredUserVariableUpdateComposer', () =>
{
    it('preserves the four-int custom variable payload', () =>
    {
        expect(new WiredUserVariableUpdateComposer(0, 42, 19, 7).getMessageArray()).toEqual([ 0, 42, 19, 7 ]);
    });

    it('appends a token for built-in user and global writes', () =>
    {
        expect(new WiredUserVariableUpdateComposer(0, 42, 0, 150, 'internal:@altitude').getMessageArray()).toEqual([ 0, 42, 0, 150, 'internal:@altitude' ]);
        expect(new WiredUserVariableUpdateComposer(3, 8, 0, 9, 'internal:@teams.red.score').getMessageArray()).toEqual([ 3, 8, 0, 9, 'internal:@teams.red.score' ]);
    });
});
