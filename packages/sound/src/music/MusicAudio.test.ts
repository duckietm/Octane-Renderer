import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebAudioMusicAudio } from './MusicAudio';

class FakeSource
{
    public buffer: unknown = null;
    public onended: (() => void) | null = null;
    public connect = vi.fn();
    public disconnect = vi.fn();
    public start = vi.fn();
    public stop = vi.fn();
}

class FakeContext
{
    public static last: FakeContext;

    public state = 'suspended';
    public currentTime = 0;
    public destination = {};
    public sources: FakeSource[] = [];
    public gain = { gain: { value: 1, setValueAtTime: vi.fn() }, connect: vi.fn() };
    public resume = vi.fn(async () => { this.state = 'running'; });
    public decodeAudioData = vi.fn(async () => ({ duration: 2.5 }));

    constructor()
    {
        FakeContext.last = this;
    }

    public createGain()
    {
        return this.gain;
    }

    public createBufferSource()
    {
        const source = new FakeSource();

        this.sources.push(source);

        return source;
    }
}

const fetchOk = vi.fn(async () => ({ ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(4) }) as unknown as Response);

beforeEach(() => vi.stubGlobal('AudioContext', FakeContext));
afterEach(() => vi.unstubAllGlobals());

describe('WebAudioMusicAudio', () =>
{
    it('decodes a sample and plays it through the master gain from the asked offset', async () =>
    {
        const audio = new WebAudioMusicAudio(fetchOk);
        const sample = await audio.load('https://cdn.example/sound_machine_sample_1.mp3');
        const context = FakeContext.last;

        expect(sample.duration).toBe(2.5);
        expect(context.gain.connect).toHaveBeenCalledWith(context.destination);

        sample.play(1);

        expect(context.sources[0].connect).toHaveBeenCalledWith(context.gain);
        expect(context.sources[0].start).toHaveBeenCalledWith(0, 1);
        expect(sample.isPlaying()).toBe(true);

        context.sources[0].onended();

        expect(sample.isPlaying()).toBe(false);
    });

    it('rejects a sample the server does not have', async () =>
    {
        const audio = new WebAudioMusicAudio(async () => ({ ok: false, status: 404 }) as Response);

        await expect(audio.load('missing.mp3')).rejects.toThrow(/404/);
    });

    it('stops every playback of every sample at once, and a single playback alone', async () =>
    {
        const audio = new WebAudioMusicAudio(fetchOk);
        const first = await audio.load('a.mp3');
        const second = await audio.load('b.mp3');
        const context = FakeContext.last;

        const voice = first.play();
        first.play();
        second.play();

        voice.stop();

        expect(context.sources[0].stop).toHaveBeenCalledOnce();
        expect(first.isPlaying()).toBe(true);

        audio.stopAll();

        expect(context.sources.every(source => source.stop.mock.calls.length === 1)).toBe(true);
        expect(first.isPlaying()).toBe(false);
        expect(second.isPlaying()).toBe(false);
    });

    it('keeps the volume set before the first sample and applies later changes to the master gain', async () =>
    {
        const audio = new WebAudioMusicAudio(fetchOk);

        audio.setVolume(0.3);
        await audio.load('a.mp3');

        expect(FakeContext.last.gain.gain.value).toBe(0.3);

        audio.setVolume(0.7);

        expect(FakeContext.last.gain.gain.setValueAtTime).toHaveBeenCalledWith(0.7, 0);
        expect(audio.getVolume()).toBe(0.7);
    });

    it('resumes a suspended output on unlock and on the next user gesture', async () =>
    {
        const audio = new WebAudioMusicAudio(fetchOk);

        expect(await audio.unlock()).toBe(false);

        await audio.load('a.mp3');

        expect(audio.unlocked).toBe(false);

        document.dispatchEvent(new Event('keydown'));
        await Promise.resolve();

        expect(FakeContext.last.resume).toHaveBeenCalledOnce();
        expect(audio.unlocked).toBe(true);
    });

    it('plays nothing once a sample is unloaded', async () =>
    {
        const audio = new WebAudioMusicAudio(fetchOk);
        const sample = await audio.load('a.mp3');

        sample.play();
        sample.unload();
        sample.play();

        expect(FakeContext.last.sources).toHaveLength(1);
        expect(FakeContext.last.sources[0].stop).toHaveBeenCalledOnce();
    });
});
