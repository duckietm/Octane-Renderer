import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('FurnitureChestVisualization icons', () =>
{
    const source = readFileSync(join(__dirname, 'FurnitureChestVisualization.ts'), 'utf8');
    const load = source.slice(source.indexOf('private async loadIcon('), source.indexOf('private iconIndexOf('));

    it('drops an icon that loaded after the visuals changed', () =>
    {
        expect(source).toContain('this._iconGeneration++;');
        expect(load.indexOf('const generation = this._iconGeneration;')).toBeLessThan(load.indexOf('await Assets.load'));
        expect(load.indexOf('if(generation !== this._iconGeneration) return;')).toBeLessThan(load.indexOf('this._iconAssetNames[index] = name;'));
    });

    it('does not ask again for an icon that failed', () =>
    {
        expect(load.indexOf('_failedIcons.has(name)')).toBeLessThan(load.indexOf('await Assets.load'));
        expect(load).toContain('FurnitureChestVisualization._failedIcons.add(name);');
    });
});
