import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AvatarVisualization wired glow', () =>
{
    const visualization = readFileSync(join(__dirname, 'AvatarVisualization.ts'), 'utf8');
    const avatarImage = readFileSync(join(__dirname, '../../../../../avatar/src/AvatarImage.ts'), 'utf8');

    it('rebuilds the glow only when the body frame may have changed', () =>
    {
        expect(visualization).not.toContain('body.alpha : 255, true)');
        expect(visualization).toContain('body.alpha : 255, bodyRedrawn)');
        expect(visualization).toContain('(this._avatarImage !== this._wiredHighlightBodyImage)');
    });

    it('counts a new revision only past the cached-frame early return', () =>
    {
        const early = avatarImage.indexOf('return this._activeTexture;');
        const bump = avatarImage.indexOf('this._textureRevision++;');

        expect(early).toBeGreaterThan(-1);
        expect(bump).toBeGreaterThan(early);
    });
});
