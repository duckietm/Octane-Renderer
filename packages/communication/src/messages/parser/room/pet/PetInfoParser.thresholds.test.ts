import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('PetInfoParser skill thresholds', () =>
{
    it('sorts the thresholds as numbers', () =>
    {
        const source = readFileSync(join(__dirname, 'PetInfoParser.ts'), 'utf8');

        expect([ 100, 20, 3 ].sort((a, b) => a - b)).toEqual([ 3, 20, 100 ]);
        expect(source).toContain('this._skillThresholds.sort((a, b) => a - b);');
        expect(source).not.toContain('this._skillThresholds.sort();');
    });
});
