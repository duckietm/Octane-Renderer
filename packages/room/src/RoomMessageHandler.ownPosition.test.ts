import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Every status of the own user wrote its position to sessionStorage, synchronously, for spawn coordinates the server
// never trusts.
describe('RoomMessageHandler own position', () =>
{
    it('does not write the position to storage on every status', () =>
    {
        const source = readFileSync(resolve(__dirname, 'RoomMessageHandler.ts'), 'utf8');

        expect(source).not.toContain('nitro.session.lastPosX');
        expect(source).not.toContain('nitro.session.lastPosY');
    });
});
