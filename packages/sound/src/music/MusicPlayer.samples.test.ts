import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MusicPlayer } from './MusicPlayer';

const howls = vi.hoisted(() => [] as any[]);

vi.mock('howler', () => ({
    Howler: { stop: vi.fn(), _audioUnlocked: true },
    Howl: class
    {
        public handlers = new Map<string, () => void>();
        public unload = vi.fn();

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
vi.mock('@octane/events', () => ({ GetEventDispatcher: () => ({ dispatchEvent: vi.fn() }), SoundManagerEvent: class {} }));

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
