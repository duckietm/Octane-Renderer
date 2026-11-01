import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// The password of a locked room was kept in sessionStorage in clear text, readable by any script on the page.
describe('RoomSessionManager room password', () =>
{
    const source = readFileSync(resolve(__dirname, 'RoomSessionManager.ts'), 'utf8');

    it('never writes the password to storage', () =>
    {
        expect(source).not.toContain('sessionStorage.setItem(STORAGE_KEY_ROOM_PASSWORD');
        expect(source).not.toContain('sessionStorage.getItem(STORAGE_KEY_ROOM_PASSWORD)');
    });

    it('clears a password an older version left there', () =>
    {
        expect(source).toContain('sessionStorage.removeItem(STORAGE_KEY_ROOM_PASSWORD);');
    });
});
