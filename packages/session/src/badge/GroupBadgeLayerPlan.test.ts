import { describe, expect, it } from 'vitest';
import { GroupBadgePartImage, planGroupBadgeLayers } from './GroupBadgeLayerPlan';

interface Part { type: string; key: number }

const bases = new Map<number, string[]>([[ 6, [ 'base_advanced_1' ] ]]);
const symbols = new Map<number, string[]>([[ 6, [ 'symbol_bobba' ] ], [ 186, [ 'symbol_d' ] ], [ 200, [ 'symbol_r' ] ]]);

const plan = (parts: Part[], images: Record<string, GroupBadgePartImage<string>['status']>, partsKnown = true) =>
    planGroupBadgeLayers<string, Part>(parts, {
        names: part => (part.type === 'b' ? bases : symbols).get(part.key),
        image: name => (images[name] === 'ready' ? { status: 'ready', texture: name } : { status: images[name] ?? 'pending' }),
        partsKnown,
        position: () => ({ x: 0, y: 0 }),
        tint: part => part.key
    });

const allReady = { base_advanced_1: 'ready', symbol_bobba: 'ready', symbol_d: 'ready', symbol_r: 'ready' } as const;

describe('planGroupBadgeLayers', () =>
{
    it('draws a badge whose base the hotel does not have, without that base', () =>
    {
        // b186173s006114s200175s186173: base 186 is not in guilds_elements.
        const result = plan([{ type: 'b', key: 186 }, { type: 's', key: 6 }, { type: 's', key: 200 }, { type: 's', key: 186 }], allReady);

        expect(result.layers?.map(layer => layer.texture)).toEqual([ 'symbol_bobba', 'symbol_r', 'symbol_d' ]);
        expect(result.skipped).toEqual([{ type: 'b', key: 186 }]);
    });

    it('waits while the part list may be a stale cache, and while an image downloads', () =>
    {
        expect(plan([{ type: 'b', key: 186 }, { type: 's', key: 6 }], allReady, false).layers).toBeNull();
        expect(plan([{ type: 'b', key: 6 }, { type: 's', key: 6 }], { base_advanced_1: 'ready', symbol_bobba: 'pending' }).layers).toBeNull();
    });

    it('leaves out a part whose image failed and tints only the first layer of a part', () =>
    {
        const result = plan([{ type: 'b', key: 6 }, { type: 's', key: 200 }], { base_advanced_1: 'ready', symbol_r: 'failed' });

        expect(result.layers).toEqual([{ texture: 'base_advanced_1', x: 0, y: 0, tint: 6 }]);
        expect(result.skipped).toEqual([{ type: 's', key: 200 }]);
    });

    it('has nothing to draw when no part could be drawn', () =>
    {
        expect(plan([{ type: 'b', key: 186 }], allReady).layers).toBeNull();
    });
});
