// Ported from plus-emulator/volt-renderer (by Dennis, GPL-3.0).
import { Texture } from 'pixi.js';

export type RegionHitMap = { pixels: Uint8ClampedArray; dirty: boolean; time: number };

// Textures that are a region of a larger render target (avatar atlas cells). Their hit map covers
// the region only, so hovering one avatar never reads back a whole atlas page.
const regions: WeakMap<Texture, RegionHitMap> = new WeakMap();

export const RegisterRegionHitMap = (texture: Texture): void =>
{
    if(texture) regions.set(texture, { pixels: null, dirty: true, time: 0 });
};

export const UnregisterRegionHitMap = (texture: Texture): void =>
{
    if(texture) regions.delete(texture);
};

export const MarkRegionHitMapDirty = (texture: Texture): void =>
{
    const region = regions.get(texture);

    if(region) region.dirty = true;
};

export const GetRegionHitMap = (texture: Texture): RegionHitMap => regions.get(texture) ?? null;
