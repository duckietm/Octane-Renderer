import { describe, expect, it, vi } from 'vitest';
import type { AvatarImageBodyPartContainer } from '../AvatarImageBodyPartContainer';
import type { AvatarImagePartContainer } from '../AvatarImagePartContainer';
import { AvatarImageDirectionCache } from './AvatarImageDirectionCache';

const part = (count: number) => ({ frameCount: count, getCacheableKey: vi.fn((frame: number) => `${ frame % count }`) });

describe('avatar direction cache keys', () =>
{
    it('builds keys only once per combined animation period for 1000 avatars', () =>
    {
        const parts = [ part(4), part(6) ];
        const caches = Array.from({ length: 1000 }, () => new AvatarImageDirectionCache(parts as unknown as AvatarImagePartContainer[]));

        for(let frame = 0; frame < 120; frame++)
        {
            for(const cache of caches) cache.getImageContainer(frame);
        }

        // lcm(4, 6) = 12 slots per cache, whatever the frame count.
        expect(parts[0].getCacheableKey).toHaveBeenCalledTimes(12 * 1000);
        expect(parts[1].getCacheableKey).toHaveBeenCalledTimes(12 * 1000);

        for(const cache of caches) cache.dispose();
    });

    it('keeps matching frames and does not memoize long periods', () =>
    {
        const parts = [ part(17), part(19) ];
        const cache = new AvatarImageDirectionCache(parts as unknown as AvatarImagePartContainer[]);
        const image = { dispose: vi.fn() } as unknown as AvatarImageBodyPartContainer;

        cache.updateImageContainer(image, 1);

        // 324 = 1 + 17 * 19: the same key as frame 1.
        expect(cache.getImageContainer(324)).toBe(image);
        expect(cache.getImageContainer(2)).toBeNull();
        expect(parts[0].getCacheableKey).toHaveBeenCalledTimes(3);

        cache.dispose();
        expect(image.dispose).toHaveBeenCalledOnce();
    });

    it('can be disposed twice', () =>
    {
        const cache = new AvatarImageDirectionCache([]);

        cache.dispose();
        expect(() => cache.dispose()).not.toThrow();
    });
});

describe('avatar action cache directions', () =>
{
    const direction = () => ({ dispose: vi.fn() }) as unknown as AvatarImageDirectionCache;

    it('without the atlas keeps the three most recently used directions and disposes the evicted one', async () =>
    {
        const { AvatarImageActionCache } = await import('./AvatarImageActionCache');

        AvatarImageActionCache.MAX_DIRECTIONS = AvatarImageActionCache.DEFAULT_MAX_DIRECTIONS;

        try
        {
            const cache = new AvatarImageActionCache();
            const [ d0, d1, d2, d3 ] = [ direction(), direction(), direction(), direction() ];

            cache.updateDirectionCache(0, d0);
            cache.updateDirectionCache(1, d1);
            cache.updateDirectionCache(2, d2);
            cache.getDirectionCache(0);
            cache.updateDirectionCache(3, d3);

            expect(d1.dispose).toHaveBeenCalledOnce();
            expect(cache.getDirectionCache(1)).toBeNull();
            expect(cache.getDirectionCache(0)).toBe(d0);
            expect(d0.dispose).not.toHaveBeenCalled();
        }
        finally
        {
            AvatarImageActionCache.MAX_DIRECTIONS = AvatarImageActionCache.ATLAS_MAX_DIRECTIONS;
        }
    });

    it('with the atlas (on from the start) keeps all eight directions', async () =>
    {
        const { AvatarImageActionCache } = await import('./AvatarImageActionCache');

        expect(AvatarImageActionCache.MAX_DIRECTIONS).toBe(8);

        const cache = new AvatarImageActionCache();
        const directions = Array.from({ length: 8 }, () => direction());

        directions.forEach((entry, index) => cache.updateDirectionCache(index, entry));
        directions.forEach((entry, index) => expect(cache.getDirectionCache(index)).toBe(entry));

        expect(directions.every(entry => !(entry.dispose as unknown as { mock: { calls: unknown[] } }).mock.calls.length)).toBe(true);
    });

    it('disposes a direction that is replaced by a fresh one', async () =>
    {
        const { AvatarImageActionCache } = await import('./AvatarImageActionCache');
        const cache = new AvatarImageActionCache();
        const [ old, fresh ] = [ direction(), direction() ];

        cache.updateDirectionCache(4, old);
        cache.updateDirectionCache(4, fresh);
        cache.updateDirectionCache(4, fresh);

        expect(old.dispose).toHaveBeenCalledOnce();
        expect(fresh.dispose).not.toHaveBeenCalled();
    });
});
