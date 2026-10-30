import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SessionDataManager furniture overrides', () =>
{
    const source = readFileSync(join(__dirname, 'SessionDataManager.ts'), 'utf8');
    const apply = source.slice(source.indexOf('public async applyFurnitureDataOverrides'), source.indexOf('public clearFurnitureDataOverrides'));

    it('applies only the newest request, checked after each wait', () =>
    {
        expect(apply).toContain('const request = ++this._furnitureOverridesRequest;');
        expect(apply.split('if(request !== this._furnitureOverridesRequest) return;').length - 1).toBe(2);
        expect(apply.indexOf('if(request !== this._furnitureOverridesRequest) return;', apply.indexOf('parseConfigJsonFromResponse')))
            .toBeLessThan(apply.indexOf('this._floorItemOverrides ='));
    });

    it('a clear makes a pending request stale', () =>
    {
        const clear = source.slice(source.indexOf('public clearFurnitureDataOverrides'));

        expect(clear.slice(0, 200)).toContain('this._furnitureOverridesRequest++;');
    });
});
