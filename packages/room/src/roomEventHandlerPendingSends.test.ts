import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('RoomObjectEventHandler pending sends', () =>
{
    const handler = readFileSync(join(__dirname, 'RoomObjectEventHandler.ts'), 'utf8');
    const engine = readFileSync(join(__dirname, 'RoomEngine.ts'), 'utf8');

    it('clears the walk and look timers on demand', () =>
    {
        const cancel = handler.slice(handler.indexOf('public cancelPendingSends(): void'));

        expect(cancel.slice(0, 400)).toContain('clearTimeout(this._walkDebounceTimer);');
        expect(cancel.slice(0, 400)).toContain('this.clearPendingAvatarLook();');
    });

    it('is asked to when a room is removed and when the engine is disposed', () =>
    {
        const remove = engine.slice(engine.indexOf('public removeRoomInstance(roomId: number): void'));
        const dispose = engine.slice(engine.indexOf('public dispose(): void'));

        expect(remove.slice(0, 200)).toContain('this._roomObjectEventHandler?.cancelPendingSends();');
        expect(dispose.slice(0, 600)).toContain('this._roomObjectEventHandler?.cancelPendingSends();');
    });

    it('a delayed walk checks the connection first', () =>
    {
        expect(handler).toContain('if(!connection) return;');
    });
});
