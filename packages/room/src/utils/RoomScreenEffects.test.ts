import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomRotatingEffect } from './RoomRotatingEffect';
import { RoomShakingEffect } from './RoomShakingEffect';

const clock = vi.hoisted(() => ({ now: 0 }));

vi.mock('@octane/utils', () => ({ GetTickerTime: () => clock.now }));

// `:shake` / `:rotate` run init() then turnVisualizationOn(); a second command inside the first one's duration kept
// the first timer, which switched the new effect off early.
describe.each([ [ 'RoomShakingEffect', RoomShakingEffect ], [ 'RoomRotatingEffect', RoomRotatingEffect ] ])('%s', (_name, effect) =>
{
    beforeEach(() =>
    {
        vi.useFakeTimers();
        clock.now = 0;
    });

    afterEach(() =>
    {
        effect.turnVisualizationOff();
        vi.useRealTimers();
    });

    it('runs a restarted effect for its full duration', () =>
    {
        effect.init(0, 5000);
        effect.turnVisualizationOn();

        vi.advanceTimersByTime(4000);
        clock.now = 4000;

        effect.init(0, 5000);
        effect.turnVisualizationOn();

        vi.advanceTimersByTime(2000);
        clock.now = 6000;

        expect(effect.isVisualizationOn()).toBe(true);

        vi.advanceTimersByTime(3000);

        expect(effect.isVisualizationOn()).toBe(false);
    });
});
