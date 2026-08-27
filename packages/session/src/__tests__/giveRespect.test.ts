import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The pacing logic in isolation. The server drops a respect that arrives
 * inside its handler ratelimit without running the handler, so the client has
 * to space the sends or the counter drifts away from what was delivered.
 */
class RespectPacer
{
    public static readonly MIN_INTERVAL = 250;

    public sent: number[] = [];
    public respectsLeft: number;

    private pending: number[] = [];
    private nextAt = 0;
    private timer: ReturnType<typeof setTimeout> = null;

    constructor(respectsLeft: number)
    {
        this.respectsLeft = respectsLeft;
    }

    public give(userId: number): void
    {
        if((userId < 0) || (this.respectsLeft <= 0)) return;

        this.respectsLeft--;
        this.pending.push(userId);
        this.flush();
    }

    private flush(): void
    {
        if(this.timer || !this.pending.length) return;

        const wait = this.nextAt - Date.now();

        if(wait > 0)
        {
            this.timer = setTimeout(() => { this.timer = null; this.flush(); }, wait);

            return;
        }

        this.sent.push(this.pending.shift());
        this.nextAt = Date.now() + RespectPacer.MIN_INTERVAL;
        this.flush();
    }
}

describe('respect pacing', () =>
{
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('delivers every respect of a rapid burst instead of losing them to the server ratelimit', () =>
    {
        const pacer = new RespectPacer(3);

        pacer.give(10);
        pacer.give(10);
        pacer.give(10);

        // only the first is on the wire; the rest would have been dropped
        expect(pacer.sent).toEqual([ 10 ]);

        vi.advanceTimersByTime(250);
        expect(pacer.sent).toEqual([ 10, 10 ]);

        vi.advanceTimersByTime(250);
        expect(pacer.sent).toEqual([ 10, 10, 10 ]);
    });

    it('never hands out more respects than are left', () =>
    {
        const pacer = new RespectPacer(2);

        pacer.give(10);
        pacer.give(10);
        pacer.give(10);

        vi.advanceTimersByTime(1000);

        expect(pacer.sent).toHaveLength(2);
        expect(pacer.respectsLeft).toBe(0);
    });
});
