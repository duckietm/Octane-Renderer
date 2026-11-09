import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The pool's idle sweep existed but nothing called it, so pooled textures were only freed by the byte cap.
describe('RoomEngine texture pool sweep', () =>
{
    it('sweeps idle pooled textures on every update', () =>
    {
        const source = readFileSync(join(__dirname, 'RoomEngine.ts'), 'utf8');
        const update = source.slice(source.indexOf('public update(ticker: Ticker): void'), source.indexOf('this._roomManager.update(time, update);'));

        expect(update).toContain('GetTexturePool().run();');
    });
});
