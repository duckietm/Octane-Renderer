import { describe, expect, it } from 'vitest';
import { ObjectRolling } from '@octane/api';
import { wiredMovementPosture, wiredMovementSeatOffset, wiredSeatAnchorId } from './wiredMovementPosture';

describe('wiredMovementPosture', () =>
{
    it('walks on a wired walk', () =>
    {
        expect(wiredMovementPosture(ObjectRolling.MOVE, 'sit')).toBe('mv');
    });

    it('keeps a user carried on a seat or bed sitting or lying', () =>
    {
        expect(wiredMovementPosture(ObjectRolling.SLIDE, 'sit')).toBeNull();
        expect(wiredMovementPosture(ObjectRolling.SLIDE, 'lay')).toBeNull();
    });

    it('stands a sliding user up otherwise', () =>
    {
        expect(wiredMovementPosture(ObjectRolling.SLIDE, 'std')).toBe('std');
        expect(wiredMovementPosture(ObjectRolling.SLIDE, undefined)).toBe('std');
    });
});

describe('wiredMovementSeatOffset', () =>
{
    it('keeps the seat height of a sitter or a lying user a slide carries', () =>
    {
        expect(wiredMovementSeatOffset(ObjectRolling.SLIDE, 'sit', 1)).toBe(1);
        expect(wiredMovementSeatOffset(ObjectRolling.SLIDE, 'lay', 0.5)).toBe(0.5);
    });

    it('adds nothing on a walk, for a standing user or without a height', () =>
    {
        expect(wiredMovementSeatOffset(ObjectRolling.MOVE, 'sit', 1)).toBe(0);
        expect(wiredMovementSeatOffset(ObjectRolling.SLIDE, 'std', 1)).toBe(0);
        expect(wiredMovementSeatOffset(ObjectRolling.SLIDE, 'sit', undefined)).toBe(0);
        expect(wiredMovementSeatOffset(ObjectRolling.SLIDE, 'sit', 0)).toBe(0);
    });
});

describe('wiredSeatAnchorId', () =>
{
    const at = (x: number, y: number) => ({ x, y });
    const throne = { id: 7, location: at(8, 12), targetLocation: at(8, 12) };
    const sitter = { location: at(8, 12), targetLocation: at(8, 12) };

    it('lets a sitter follow the seat the same batch moves in place under it', () =>
    {
        expect(wiredSeatAnchorId(ObjectRolling.SLIDE, 'sit', sitter, [ throne ])).toBe(7);
        expect(wiredSeatAnchorId(ObjectRolling.SLIDE, 'lay', sitter, [ throne ])).toBe(7);
    });

    it('finds a rider on another tile of a larger seat', () =>
    {
        const bed = { id: 9, location: at(8, 11), targetLocation: at(8, 11) };

        expect(wiredSeatAnchorId(ObjectRolling.SLIDE, 'lay', sitter, [ bed ], () => ({ width: 1, length: 2 }))).toBe(9);
        expect(wiredSeatAnchorId(ObjectRolling.SLIDE, 'lay', sitter, [ bed ])).toBeNull();
    });

    it('lets a standing user follow the tile it stands on', () =>
    {
        const tile = { id: 3, location: { x: 9, y: 6, z: 0.24 }, targetLocation: { x: 9, y: 6, z: 0.46 } };
        const stander = { location: { x: 9, y: 6, z: 0.26 }, targetLocation: { x: 9, y: 6, z: 0.48 } };

        expect(wiredSeatAnchorId(ObjectRolling.SLIDE, 'std', stander, [ tile ])).toBe(3);
    });

    it('picks the highest furni at or under the feet of a standing user', () =>
    {
        const low = { id: 1, location: { x: 9, y: 6, z: 0 }, targetLocation: { x: 9, y: 6, z: 0.2 } };
        const mid = { id: 2, location: { x: 9, y: 6, z: 0.5 }, targetLocation: { x: 9, y: 6, z: 0.7 } };
        const above = { id: 4, location: { x: 9, y: 6, z: 3 }, targetLocation: { x: 9, y: 6, z: 3.2 } };
        const stander = { location: { x: 9, y: 6, z: 0.8 }, targetLocation: { x: 9, y: 6, z: 1 } };

        expect(wiredSeatAnchorId(ObjectRolling.SLIDE, 'std', stander, [ low, above, mid ])).toBe(2);
    });

    it('leaves a walking user, a moved seat and another tile alone', () =>
    {
        expect(wiredSeatAnchorId(ObjectRolling.SLIDE, 'mv', sitter, [ throne ])).toBeNull();
        expect(wiredSeatAnchorId(ObjectRolling.MOVE, 'sit', sitter, [ throne ])).toBeNull();
        expect(wiredSeatAnchorId(ObjectRolling.SLIDE, 'sit', sitter, [ { id: 7, location: at(8, 12), targetLocation: at(9, 12) } ])).toBeNull();
        expect(wiredSeatAnchorId(ObjectRolling.SLIDE, 'sit', { location: at(3, 3), targetLocation: at(3, 3) }, [ throne ])).toBeNull();
    });
});
