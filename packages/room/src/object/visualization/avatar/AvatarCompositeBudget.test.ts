import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const clock = vi.hoisted(() => ({ time: 0 }));
const atlas = vi.hoisted(() => ({ atlasEnabled: false, lastCompositionFlushJobs: 0, lastCompositionFlushMs: 0 }));

vi.mock('@octane/utils', () => ({ GetTickerTime: () => clock.time }));
vi.mock('@octane/avatar', () => ({ GetAvatarRenderManager: () => atlas }));

import { AvatarCompositeBudget } from './AvatarCompositeBudget';

const frame = () =>
{
    clock.time += 16;
};

describe('AvatarCompositeBudget', () =>
{
    beforeEach(() =>
    {
        clock.time = 0;
        atlas.atlasEnabled = false;
        atlas.lastCompositionFlushJobs = 0;
        atlas.lastCompositionFlushMs = 0;
        AvatarCompositeBudget.ENABLED = true;
        AvatarCompositeBudget.reset();
    });

    afterEach(() =>
    {
        AvatarCompositeBudget.ENABLED = true;
    });

    it('lets every avatar redraw while the crowd fits in a frame', () =>
    {
        frame();

        for(let id = 0; id < 20; id++) expect(AvatarCompositeBudget.allow(id)).toBe(true);
    });

    it('works out how many redraws fit from what one costs', () =>
    {
        // 4 ms a frame: 0.0625 ms each is 64; a costly redraw still leaves 32; a free one counts as a thousandth of a millisecond.
        expect(AvatarCompositeBudget.shareFor(0.0625)).toBe(64);
        expect(AvatarCompositeBudget.shareFor(2)).toBe(32);
        expect(AvatarCompositeBudget.shareFor(0)).toBe(4000);
    });

    it('makes a crowd take turns once redraws are costly', () =>
    {
        // A frame in which 100 avatars asked, each redraw taking 0.5 ms.
        frame();
        for(let id = 0; id < 100; id++)
        {
            AvatarCompositeBudget.allow(id);
            AvatarCompositeBudget.record(0.5);
        }

        // Several frames on, the measured cost has settled near 0.5 ms: far fewer than 100 fit.
        let allowed = 0;

        for(let step = 0; step < 12; step++)
        {
            frame();
            allowed = 0;

            for(let id = 0; id < 100; id++)
            {
                if(!AvatarCompositeBudget.allow(id)) continue;

                allowed++;
                AvatarCompositeBudget.record(0.5);
            }
        }

        expect(allowed).toBeGreaterThan(0);
        expect(allowed).toBeLessThan(100);
    });

    it('gives every avatar its turn within a few frames', () =>
    {
        const drawn = new Set<number>();

        for(let step = 0; step < 40; step++)
        {
            frame();

            for(let id = 0; id < 200; id++)
            {
                if(!AvatarCompositeBudget.allow(id)) continue;

                drawn.add(id);
                AvatarCompositeBudget.record(0.5);
            }
        }

        expect(drawn.size).toBe(200);
    });

    // Twelve frames of 200 avatars asking for a redraw that costs 0.05 ms to prepare; returns how many the last frame let through.
    const settle = (): number =>
    {
        let allowed = 0;

        for(let step = 0; step < 12; step++)
        {
            frame();
            allowed = 0;

            for(let id = 0; id < 200; id++)
            {
                if(!AvatarCompositeBudget.allow(id)) continue;

                allowed++;
                AvatarCompositeBudget.record(0.05);
            }
        }

        return allowed;
    };

    it('charges each redraw its share of a big atlas flush while the atlas is on', () =>
    {
        // 100 avatars flushed in 10 ms: 0.1 ms each on top of the 0.05 ms of preparing.
        atlas.atlasEnabled = true;
        atlas.lastCompositionFlushJobs = 100;
        atlas.lastCompositionFlushMs = 10;

        const withFlush = settle();

        AvatarCompositeBudget.reset();
        atlas.lastCompositionFlushJobs = 0;
        atlas.lastCompositionFlushMs = 0;

        const withoutFlush = settle();

        expect(withFlush).toBeLessThan(withoutFlush);
        expect(withFlush).toBeGreaterThan(0);
    });

    it('ignores the flush while the atlas is off and flushes too small to measure', () =>
    {
        const plain = settle();

        AvatarCompositeBudget.reset();
        atlas.lastCompositionFlushJobs = 100;
        atlas.lastCompositionFlushMs = 10;

        expect(settle()).toBe(plain);

        // On, but only 8 avatars flushed: the fixed cost per page would be charged to each of them.
        AvatarCompositeBudget.reset();
        atlas.atlasEnabled = true;
        atlas.lastCompositionFlushJobs = 8;
        atlas.lastCompositionFlushMs = 10;

        const small = settle();

        AvatarCompositeBudget.reset();
        atlas.lastCompositionFlushJobs = 0;
        atlas.lastCompositionFlushMs = 0;

        expect(small).toBe(settle());
    });

    it('holds nothing back when switched off', () =>
    {
        AvatarCompositeBudget.ENABLED = false;
        frame();

        for(let id = 0; id < 5000; id++) expect(AvatarCompositeBudget.allow(id)).toBe(true);
    });
});
