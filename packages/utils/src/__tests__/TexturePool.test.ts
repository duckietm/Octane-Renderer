import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Texture } from 'pixi.js';
import { TexturePool } from '../TexturePool';

vi.mock('@octane/utils', () => ({
    OctaneLogger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
    TextureUtils: {
        createRenderTexture: vi.fn((width: number, height: number) => makeTexture(width, height))
    }
}));

const makeTexture = (width: number, height: number): Texture =>
{
    const texture = {
        width,
        height,
        destroyed: false,
        source: { hitMap: null, hitMapDirty: false, pixelWidth: width, pixelHeight: height },
        destroy: vi.fn(function(this: { destroyed: boolean })
        {
            this.destroyed = true;
        })
    };

    return texture as unknown as Texture;
};

const MAX_IDLE_MS = 30000;
const SWEEP_INTERVAL_MS = 1000;
const MAX_POOL_BYTES = 64 * 1024 * 1024;

// One-pixel-wide texture whose RGBA footprint is exactly `bytes`.
const makeTextureOfBytes = (bytes: number): Texture => makeTexture(1, bytes / 4);

describe('TexturePool', () =>
{
    let pool: TexturePool;

    beforeEach(() =>
    {
        vi.useFakeTimers();
        vi.setSystemTime(100000);

        pool = new TexturePool();
    });

    afterEach(() => vi.useRealTimers());

    it('hands a pooled texture back for the same size', () =>
    {
        const texture = makeTexture(32, 16);

        pool.putTexture(texture);

        expect(pool.getTotalTextures()).toBe(1);
        expect(pool.getTexture(32, 16)).toBe(texture);
        expect(pool.getTotalTextures()).toBe(0);
    });

    it('creates a fresh texture when nothing pooled matches', () =>
    {
        pool.putTexture(makeTexture(32, 16));

        const texture = pool.getTexture(64, 64);

        expect(texture.width).toBe(64);
        expect(texture.height).toBe(64);
        expect(pool.getTotalTextures()).toBe(1);
    });

    it('releases a texture that sat idle in the pool for longer than MAX_IDLE_MS', () =>
    {
        const texture = makeTexture(32, 16);

        pool.putTexture(texture);
        vi.advanceTimersByTime(MAX_IDLE_MS);
        pool.run();

        expect(texture.destroy).not.toHaveBeenCalled();
        expect(pool.getTotalTextures()).toBe(1);

        vi.advanceTimersByTime(SWEEP_INTERVAL_MS);
        pool.run();

        expect(texture.destroy).toHaveBeenCalledWith(true);
        expect(pool.getTotalTextures()).toBe(0);
        // The emptied bucket goes too, so run() does not keep walking sizes that hold nothing.
        expect(pool.textures[32]).toBeUndefined();
    });

    it('only sweeps once per SWEEP_INTERVAL_MS no matter how often run() is called', () =>
    {
        const texture = makeTexture(32, 16);

        pool.putTexture(texture);
        vi.advanceTimersByTime(MAX_IDLE_MS - 500);
        pool.run();

        vi.advanceTimersByTime(SWEEP_INTERVAL_MS - 1);

        // The texture is past its idle limit, but the last sweep happened
        // less than an interval ago, so these ticks are all no-ops.
        for(let i = 0; i < 10; i++) pool.run();

        expect(texture.destroy).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        pool.run();

        expect(texture.destroy).toHaveBeenCalledTimes(1);
    });

    it('measures idle time from when the texture was last pooled, not from pool start', () =>
    {
        vi.advanceTimersByTime(MAX_IDLE_MS * 3);

        const texture = makeTexture(8, 8);

        pool.putTexture(texture);
        vi.advanceTimersByTime(MAX_IDLE_MS);
        pool.run();

        expect(texture.destroy).not.toHaveBeenCalled();

        vi.advanceTimersByTime(SWEEP_INTERVAL_MS);
        pool.run();

        expect(texture.destroy).toHaveBeenCalledTimes(1);
    });

    it('restarts the idle clock when a texture is taken out and pooled again', () =>
    {
        const texture = makeTexture(8, 8);

        pool.putTexture(texture);
        vi.advanceTimersByTime(MAX_IDLE_MS / 2);

        expect(pool.getTexture(8, 8)).toBe(texture);

        vi.advanceTimersByTime(MAX_IDLE_MS / 2);
        pool.putTexture(texture);
        vi.advanceTimersByTime(MAX_IDLE_MS / 2);
        pool.run();

        expect(texture.destroy).not.toHaveBeenCalled();

        vi.advanceTimersByTime((MAX_IDLE_MS / 2) + SWEEP_INTERVAL_MS);
        pool.run();

        expect(texture.destroy).toHaveBeenCalledTimes(1);
    });

    it('tracks the byte footprint of pooled textures', () =>
    {
        pool.putTexture(makeTexture(32, 16));
        pool.putTexture(makeTexture(8, 8));

        expect(pool.getTotalBytes()).toBe((32 * 16 * 4) + (8 * 8 * 4));

        pool.getTexture(8, 8);

        expect(pool.getTotalBytes()).toBe(32 * 16 * 4);
        expect(pool.getTotalTextures()).toBe(1);
        expect(pool.getTotalBytes()).toBe(32 * 16 * 4);
    });

    it('evicts the oldest pooled textures to make room once the byte budget is reached', () =>
    {
        const half = MAX_POOL_BYTES / 2;
        const first = makeTextureOfBytes(half);
        const second = makeTextureOfBytes(half);

        pool.putTexture(first);
        vi.advanceTimersByTime(10);
        pool.putTexture(second);

        expect(pool.getTotalBytes()).toBe(MAX_POOL_BYTES);

        const incoming = makeTextureOfBytes(half);

        pool.putTexture(incoming);

        expect(first.destroy).toHaveBeenCalledWith(true);
        expect(second.destroy).not.toHaveBeenCalled();
        expect(incoming.destroy).not.toHaveBeenCalled();
        expect(pool.getTotalTextures()).toBe(2);
        expect(pool.getTotalBytes()).toBe(MAX_POOL_BYTES);
        expect(pool.getTexture(incoming.width, incoming.height)).toBe(second);
    });

    it('evicts as many textures as needed for a large incoming texture', () =>
    {
        const small: Texture[] = [];

        for(let i = 0; i < 4; i++)
        {
            const texture = makeTextureOfBytes(MAX_POOL_BYTES / 4);

            small.push(texture);
            pool.putTexture(texture);
            vi.advanceTimersByTime(10);
        }

        const incoming = makeTextureOfBytes(MAX_POOL_BYTES / 2);

        pool.putTexture(incoming);

        expect(small[0].destroy).toHaveBeenCalledTimes(1);
        expect(small[1].destroy).toHaveBeenCalledTimes(1);
        expect(small[2].destroy).not.toHaveBeenCalled();
        expect(small[3].destroy).not.toHaveBeenCalled();
        expect(incoming.destroy).not.toHaveBeenCalled();
        expect(pool.getTotalTextures()).toBe(3);
        expect(pool.getTotalBytes()).toBe(MAX_POOL_BYTES);
    });

    it('destroys an incoming texture that could never fit the byte budget', () =>
    {
        const pooled = makeTexture(8, 8);
        const huge = makeTextureOfBytes(MAX_POOL_BYTES + 4);

        pool.putTexture(pooled);
        pool.putTexture(huge);

        expect(huge.destroy).toHaveBeenCalledWith(true);
        expect(pooled.destroy).not.toHaveBeenCalled();
        expect(pool.getTotalTextures()).toBe(1);
    });

    it('no longer caps the pool by texture count', () =>
    {
        for(let i = 0; i < 250; i++) pool.putTexture(makeTexture(1, i + 1));

        const extra = makeTexture(2, 2);

        pool.putTexture(extra);

        expect(extra.destroy).not.toHaveBeenCalled();
        expect(pool.getTotalTextures()).toBe(251);
    });

    it('ignores destroyed or sourceless textures', () =>
    {
        const destroyed = makeTexture(4, 4);

        (destroyed as unknown as { destroyed: boolean }).destroyed = true;
        pool.putTexture(destroyed);
        pool.putTexture(null);

        expect(pool.getTotalTextures()).toBe(0);
    });
});
