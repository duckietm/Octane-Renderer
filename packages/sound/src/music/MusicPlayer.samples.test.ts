import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MusicPlayer } from './MusicPlayer';

const howls = vi.hoisted(() => [] as any[]);

vi.mock('howler', () => ({
    Howler: { stop: vi.fn(), _audioUnlocked: true },
    Howl: class
    {
        public handlers = new Map<string, () => void>();
        public unload = vi.fn();
        public play = vi.fn(() => 1);
        public playing = vi.fn(() => false);
        public seek = vi.fn();

        constructor(public options: { src: string[] })
        {
            howls.push(this);
        }

        public once(event: string, handler: () => void): void
        {
            this.handlers.set(event, handler);
        }

        public duration(): number
        {
            return 1;
        }
    }
}));
vi.mock('@octane/events', () => ({
    GetEventDispatcher: () => ({ dispatchEvent: vi.fn() }),
    SoundManagerEvent: class
    {
    }
}));

beforeEach(() =>
{
    howls.length = 0;
});

describe('MusicPlayer samples', () =>
{
    it('shares one load between requests for the same sample', async () =>
    {
        const player = new MusicPlayer('%sample%.mp3');

        const first = player.getSample(5);
        const second = player.getSample(5);

        expect(howls).toHaveLength(1);

        howls[0].handlers.get('load')();

        expect(await first).toBe(await second);
    });

    it('unloads a sample that failed and loads it again on the next request', async () =>
    {
        const player = new MusicPlayer('%sample%.mp3');

        const failed = player.getSample(5);

        howls[0].handlers.get('loaderror')();

        await expect(failed).rejects.toThrow();
        expect(howls[0].unload).toHaveBeenCalled();

        player.getSample(5);

        expect(howls).toHaveLength(2);
    });
});

describe('MusicPlayer song switch', () =>
{
    it('keeps the sequence of the newer song when an older one finishes loading', async () =>
    {
        vi.useFakeTimers();

        try
        {
            const player = new MusicPlayer('%sample%.mp3');

            const older = player.play('1:5,4:', 1);

            await player.play('1:0,2:', 2);

            howls[0].handlers.get('load')();
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
            const player = new MusicPlayer('%sample%.mp3');

            const older = player.preloadAndPlay('1:5,4:', 1);
            const newer = player.preloadAndPlay('1:6,4:', 2);

            howls[1].handlers.get('load')();
            await newer;
            howls[0].handlers.get('load')();
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
        const player = new MusicPlayer('%sample%.mp3');
        const play = vi.spyOn(player, 'play');

        const request = player.preloadAndPlay('1:5,4:', 1);

        player.stop();
        howls[0].handlers.get('load')();
        await request;

        expect(play).not.toHaveBeenCalled();
    });
});
