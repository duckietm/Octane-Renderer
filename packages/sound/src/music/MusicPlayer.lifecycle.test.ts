import { afterEach, describe, expect, it, vi } from 'vitest';
import { MusicPlayer } from './MusicPlayer';

vi.mock('howler', () => ({ Howler: { stop: vi.fn() }, Howl: vi.fn() }));
vi.mock('@octane/events', () => ({ GetEventDispatcher: () => ({ dispatchEvent: vi.fn() }), SoundManagerEvent: class {} }));

const deferred = () =>
{
    let resolve: () => void;
    const promise = new Promise<void>(done => { resolve = done; });

    return { promise, resolve: () => resolve() };
};

afterEach(() => vi.useRealTimers());

describe('MusicPlayer playback lifetime', () =>
{
    it.each([ 'preload', 'unlockAudio' ])('does not restart a stopped song once %s completes', async stage =>
    {
        vi.useFakeTimers();

        const player = new MusicPlayer('');
        const gate = deferred();
        const tick = vi.fn();

        Object.assign(player, {
            preload: () => (stage === 'preload' ? gate.promise : Promise.resolve()),
            unlockAudio: () => (stage === 'unlockAudio' ? gate.promise : Promise.resolve()),
            tick
        });

        const playing = player.play('1:1,1:', 1);

        await Promise.resolve();
        player.stop();
        gate.resolve();
        await playing;

        expect(tick).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
    });
});
