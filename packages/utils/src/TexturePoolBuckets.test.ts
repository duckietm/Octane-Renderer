import { describe, expect, it, vi } from 'vitest';
import { TexturePool, TextureUtils } from '@octane/utils';

describe('TexturePool buckets', () =>
{
    it('asking for a size that is not pooled leaves no bucket behind', () =>
    {
        const create = vi.spyOn(TextureUtils, 'createRenderTexture').mockImplementation(() => ({}) as never);
        const pool = new TexturePool();

        pool.getTexture(10, 20);
        pool.getTexture(11, 21);

        expect(pool.bucketCount).toBe(0);

        create.mockRestore();
    });

    it('taking the last pooled texture of a size drops its bucket', () =>
    {
        const pool = new TexturePool();
        const texture = { width: 4, height: 4, destroyed: false, source: { pixelWidth: 4, pixelHeight: 4 } } as never;

        pool.putTexture(texture);
        expect(pool.bucketCount).toBe(1);

        expect(pool.getTexture(4, 4)).toBe(texture);
        expect(pool.bucketCount).toBe(0);
    });
});
