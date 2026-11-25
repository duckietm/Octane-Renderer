import { Texture, TextureSource } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { GetRegionHitMap, MarkRegionHitMapDirty, RegisterRegionHitMap, UnregisterRegionHitMap } from './RegionHitMap';

describe('RegionHitMap', () =>
{
    const makeTexture = (): Texture => new Texture({ source: new TextureSource({ width: 4, height: 4 }) });

    it('knows only the textures that were registered', () =>
    {
        const texture = makeTexture();

        expect(GetRegionHitMap(texture)).toBeNull();

        RegisterRegionHitMap(texture);

        expect(GetRegionHitMap(texture)).toEqual({ pixels: null, dirty: true, time: 0 });

        UnregisterRegionHitMap(texture);

        expect(GetRegionHitMap(texture)).toBeNull();
        expect(() => RegisterRegionHitMap(null)).not.toThrow();
        expect(() => UnregisterRegionHitMap(null)).not.toThrow();
    });

    it('marks a read region dirty again and leaves other textures alone', () =>
    {
        const texture = makeTexture();
        const other = makeTexture();

        RegisterRegionHitMap(texture);

        const region = GetRegionHitMap(texture);

        region.dirty = false;

        MarkRegionHitMapDirty(other);

        expect(region.dirty).toBe(false);

        MarkRegionHitMapDirty(texture);

        expect(region.dirty).toBe(true);
    });
});
