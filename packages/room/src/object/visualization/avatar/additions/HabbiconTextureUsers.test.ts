import { Texture } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { HabbiconAssetManager } from './HabbiconAssetManager';

type Internals = { _evictedInUse: Set<Texture>; _textureUsers: Map<Texture, number> };

// The composed-texture cache destroyed its oldest entry even while a bubble in a crowded room still showed it.
describe('HabbiconAssetManager texture users', () =>
{
    it('keeps an evicted texture alive until its last bubble releases it', () =>
    {
        const manager = HabbiconAssetManager.getInstance();
        const internals = manager as unknown as Internals;
        const texture = new Texture();

        manager.retainTexture(texture);
        manager.retainTexture(texture);
        internals._evictedInUse.add(texture);

        manager.releaseTexture(texture);
        expect(texture.destroyed).toBe(false);

        manager.releaseTexture(texture);
        expect(texture.destroyed).toBe(true);
        expect(internals._textureUsers.has(texture)).toBe(false);
    });

    it('does not destroy a released texture the cache still holds', () =>
    {
        const manager = HabbiconAssetManager.getInstance();
        const texture = new Texture();

        manager.retainTexture(texture);
        manager.releaseTexture(texture);

        expect(texture.destroyed).toBe(false);
    });
});
