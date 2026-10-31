import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('FurnitureDynamicThumbnailVisualization image load', () =>
{
    const source = readFileSync(join(__dirname, 'FurnitureDynamicThumbnailVisualization.ts'), 'utf8');

    it('ignores a load for an older url or after dispose', () =>
    {
        expect(source).toContain('if(this._disposed || this._cachedUrl !== thumbnailUrl)');
        expect(source).toContain('public dispose(): void');
    });

    it('asks for CORS before it sets the source', () =>
    {
        const cors = source.indexOf('image.crossOrigin = \'anonymous\';');

        expect(cors).toBeGreaterThan(-1);
        expect(cors).toBeLessThan(source.indexOf('image.src = thumbnailUrl;'));
    });
});
