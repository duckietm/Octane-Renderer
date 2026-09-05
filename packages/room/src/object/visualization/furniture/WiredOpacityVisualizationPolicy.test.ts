import { AlphaTolerance } from '@octane/api';
import { describe, expect, it } from 'vitest';
import { composeFurnitureAlphaMultiplier, furnitureAlphaTolerance, normalizeOpacityMultiplier } from './WiredOpacityVisualizationPolicy';

describe('WiredOpacityVisualizationPolicy', () =>
{
    it('multiplies wired opacity with the existing furniture alpha', () =>
    {
        expect(composeFurnitureAlphaMultiplier(0.8, 0.5, false)).toBeCloseTo(0.4);
        expect(composeFurnitureAlphaMultiplier(0.8, 0.5, true)).toBe(0);
    });

    it('clamps invalid or hostile values without making furniture unexpectedly disappear', () =>
    {
        expect(normalizeOpacityMultiplier(Number.NaN)).toBe(1);
        expect(normalizeOpacityMultiplier(-4)).toBe(0);
        expect(normalizeOpacityMultiplier(9)).toBe(1);
    });

    it('uses visual click-through without changing server interaction authority', () =>
    {
        expect(furnitureAlphaTolerance(false, false)).toBe(AlphaTolerance.MATCH_OPAQUE_PIXELS);
        expect(furnitureAlphaTolerance(false, true)).toBe(AlphaTolerance.MATCH_NOTHING);
        expect(furnitureAlphaTolerance(true, false)).toBe(AlphaTolerance.MATCH_NOTHING);
    });
});
