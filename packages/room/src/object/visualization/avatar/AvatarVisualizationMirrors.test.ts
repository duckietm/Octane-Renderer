import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AvatarVisualization mirror textures', () =>
{
    const source = readFileSync(join(__dirname, 'AvatarVisualization.ts'), 'utf8');
    const render = source.slice(source.indexOf('private renderMirrorTextures('), source.indexOf('private updateWindowReflectionSource('));

    it('destroys the textures of directions no longer reflected before keeping the new set', () =>
    {
        const prune = render.indexOf('if(mirrors.has(key)) continue;');

        expect(prune).toBeGreaterThan(-1);
        expect(render.indexOf('this._reflectionMirrorTextures.delete(key);')).toBeGreaterThan(prune);
        expect(render.indexOf('this._reflectionMirrors = mirrors;')).toBeGreaterThan(prune);
    });
});
