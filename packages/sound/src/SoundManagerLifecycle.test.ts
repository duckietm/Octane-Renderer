import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AdvancedMap } from '@octane/utils';

describe('SoundManager lifecycle', () =>
{
    const source = readFileSync(join(__dirname, 'SoundManager.ts'), 'utf8');

    it('registers its listeners once however many times init runs', () =>
    {
        const init = source.slice(source.indexOf('public async init(): Promise<void>'));

        expect(init.indexOf('if(this._eventCallback) return;')).toBeLessThan(init.indexOf('addEventListener'));
    });

    it('empties the sample maps without making them unusable', () =>
    {
        expect(source).toContain('this._internalSamples.reset();');
        expect(source).toContain('this._furniSamples.reset();');

        const map = new AdvancedMap<string, number>();
        map.add('a', 1);
        map.reset();
        map.add('b', 2);

        expect(map.getValue('b')).toBe(2);
    });
});
