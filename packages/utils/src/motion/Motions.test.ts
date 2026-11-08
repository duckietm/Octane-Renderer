import { describe, expect, it, vi } from 'vitest';
import { Motion } from './Motion';
import { Motions } from './Motions';

vi.mock('../GetTickerTime', () => ({ GetTickerTime: () => 0 }));
vi.mock('../GetTickerFPS', () => ({ GetTickerFPS: () => 60 }));

const lists = () => Motions as unknown as { _RUNNING_MOTIONS: Motion[]; _REMOVED_MOTIONS: Motion[]; onTick: () => void };

describe('Motions', () =>
{
    it('keeps the running motions when a queued removal is no longer in the list', () =>
    {
        const stale = new Motion(document.createElement('div'));
        const kept = new Motion(document.createElement('div'));

        kept.start();
        lists()._RUNNING_MOTIONS.push(kept);
        lists()._REMOVED_MOTIONS.push(stale);

        lists().onTick();

        expect(lists()._RUNNING_MOTIONS).toContain(kept);

        lists()._RUNNING_MOTIONS.length = 0;
    });

    it('starts a motion queued during a tick on the next tick', () =>
    {
        const queued = new Motion(document.createElement('div'));
        const ticks: number[] = [];

        queued.tick = () =>
        {
            ticks.push(1);
        };

        const runner = new Motion(document.createElement('div'));

        runner.tick = () =>
        {
            Motions.runMotion(queued);
        };

        Motions.runMotion(runner);

        lists().onTick();
        lists().onTick();

        expect(queued.running).toBe(true);
        expect(ticks.length).toBe(1);
        expect(lists()._RUNNING_MOTIONS).toContain(queued);

        Motions.removeMotion(runner);
        Motions.removeMotion(queued);
    });
});
