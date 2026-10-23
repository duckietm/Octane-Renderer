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
});
