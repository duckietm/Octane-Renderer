import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MusicAudio, MusicSample } from './MusicAudio';
import { MusicPlayer } from './MusicPlayer';

vi.mock('@octane/events', () => ({
    GetEventDispatcher: () => ({ dispatchEvent: vi.fn() }),
    SoundManagerEvent: class
    {
    }
}));

interface PendingLoad
{
    url: string;
    load(): void;
    fail(): void;
}

const createSample = (): MusicSample => ({ duration: 2, play: vi.fn(() => ({ stop: vi.fn() })), isPlaying: vi.fn(() => false), unload: vi.fn() });

// Each load waits until the test lets it finish or fail.
const loads: PendingLoad[] = [];

const audio = (): MusicAudio => ({
    load: (url: string) => new Promise<MusicSample>((resolve, reject) => loads.push({ url, load: () => resolve(createSample()), fail: () => reject(new Error('decode failed')) })),
    stopAll: vi.fn(),
    setVolume: vi.fn(),
    getVolume: () => 1,
    unlocked: true,
    unlock: vi.fn(async () => true)
});

const createPlayer = () => new MusicPlayer('%sample%.mp3', audio());

beforeEach(() =>
{
    loads.length = 0;
});

describe('MusicPlayer samples', () =>
{
    it('shares one load between requests for the same sample', async () =>
    {
        const player = createPlayer();

        const first = player.getSample(5);
        const second = player.getSample(5);

        expect(loads).toHaveLength(1);
        expect(loads[0].url).toBe('5.mp3');

        loads[0].load();

        expect(await first).toBe(await second);
    });

    it('loads a sample that failed again on the next request', async () =>
    {
        const player = createPlayer();

        const failed = player.getSample(5);

        loads[0].fail();

        await expect(failed).rejects.toThrow();

        player.getSample(5);

        expect(loads).toHaveLength(2);
    });
});

describe('MusicPlayer song switch', () =>
{
    it('keeps the sequence of the newer song when an older one finishes loading', async () =>
    {
        vi.useFakeTimers();

        try
        {
            const player = createPlayer();

            const older = player.play('1:5,4:', 1);

            await player.play('1:0,2:', 2);

            loads[0].load();
            await older;

            expect(player['_sequence']).toEqual([ Array.from({ length: 4 }, () => ({ sampleId: 0, offset: 0 })) ]);
            expect(player['_currentSongId']).toBe(2);
        }
        finally
        {
            vi.clearAllTimers();
            vi.useRealTimers();
        }
    });
});

describe('MusicPlayer preloadAndPlay', () =>
{
    it('plays the newest request when an older one finishes loading last', async () =>
    {
        vi.useFakeTimers();

        try
        {
            const player = createPlayer();

            const older = player.preloadAndPlay('1:5,4:', 1);
            const newer = player.preloadAndPlay('1:6,4:', 2);

            loads[1].load();
            await newer;
            loads[0].load();
            await older;

            expect(player['_currentSongId']).toBe(2);
        }
        finally
        {
            vi.clearAllTimers();
            vi.useRealTimers();
        }
    });

    it('does not start a song stopped while its samples load', async () =>
    {
        const player = createPlayer();
        const play = vi.spyOn(player, 'play');

        const request = player.preloadAndPlay('1:5,4:', 1);

        player.stop();
        loads[0].load();
        await request;

        expect(play).not.toHaveBeenCalled();
    });
});

describe('MusicPlayer playback', () =>
{
    it('starts a sample at its beat, and joins one already under way at its offset', async () =>
    {
        vi.useFakeTimers();

        try
        {
            const player = createPlayer();
            // A 2-second sample played twice (beats: offset 0, 1, 0, 1), entered on its second beat.
            const playing = player.play('1:5,2:', 1, 1);

            loads[0].load();
            await playing;

            const sample = await player.getSample(5);

            expect(sample.play).toHaveBeenCalledWith(1);

            vi.advanceTimersByTime(1000);

            expect(sample.play).toHaveBeenCalledTimes(2);
            expect(sample.play).toHaveBeenLastCalledWith();

            vi.mocked(sample.isPlaying).mockReturnValue(true);
            vi.advanceTimersByTime(1000);

            expect(sample.play).toHaveBeenCalledTimes(2);
        }
        finally
        {
            vi.clearAllTimers();
            vi.useRealTimers();
        }
    });
});
