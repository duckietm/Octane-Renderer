import { describe, expect, it, vi } from 'vitest';
import { SoundboardChannel } from '../SoundboardChannel';

interface AudioStub
{
    pause: ReturnType<typeof vi.fn>;
    play: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
    removeAttribute: ReturnType<typeof vi.fn>;
    volume: number;
    currentTime: number;
}

const createAudioStub = (): AudioStub => ({
    pause: vi.fn(),
    play: vi.fn().mockResolvedValue(undefined),
    load: vi.fn(),
    removeAttribute: vi.fn(),
    volume: 0,
    currentTime: 9
});

describe('SoundboardChannel', () =>
{
    it('rejects unsafe schemes without creating an audio element', async () =>
    {
        const factory = vi.fn();
        const channel = new SoundboardChannel(factory as any);

        await expect(channel.play('javascript:alert(1)', 0.8)).resolves.toBe(false);
        expect(factory).not.toHaveBeenCalled();
    });

    it('lets pads overlap up to the number of voices and cuts the oldest beyond that', async () =>
    {
        const voices = [createAudioStub(), createAudioStub(), createAudioStub(), createAudioStub()];
        const factory = vi.fn();
        voices.forEach(voice => factory.mockReturnValueOnce(voice));
        const channel = new SoundboardChannel(factory as any, 3);

        for(let index = 0; index < 3; index++) await channel.play(`/sounds/pad-${ index }.mp3`, 0.8);

        expect(voices.slice(0, 3).every(voice => voice.pause.mock.calls.length === 0)).toBe(true);

        await channel.play('/sounds/pad-3.mp3', 0.8);

        expect(voices[0].pause).toHaveBeenCalledOnce();
        expect(voices[1].pause).not.toHaveBeenCalled();
        expect(voices[3].pause).not.toHaveBeenCalled();
    });

    it('cuts the pads of the same group and leaves the others sounding', async () =>
    {
        const bell = createAudioStub();
        const clap = createAudioStub();
        const chime = createAudioStub();
        const factory = vi.fn().mockReturnValueOnce(bell).mockReturnValueOnce(clap).mockReturnValueOnce(chime);
        const channel = new SoundboardChannel(factory as any);

        await channel.play('/sounds/bell.mp3', 0.8, { group: 'bells' });
        await channel.play('/sounds/clap.mp3', 0.8);
        await channel.play('/sounds/chime.mp3', 0.8, { group: ' bells ' });

        expect(bell.pause).toHaveBeenCalledOnce();
        expect(clap.pause).not.toHaveBeenCalled();
        expect(chime.pause).not.toHaveBeenCalled();
    });

    it('scales a pad by its gain and keeps the gain when the volume changes', async () =>
    {
        const quiet = createAudioStub();
        const loud = createAudioStub();
        const factory = vi.fn().mockReturnValueOnce(quiet).mockReturnValueOnce(loud);
        const channel = new SoundboardChannel(factory as any);

        await channel.play('/sounds/quiet.mp3', 0.8, { gain: 0.5 });
        await channel.play('/sounds/loud.mp3', 0.8, { gain: 4 });

        expect(quiet.volume).toBeCloseTo(0.4);
        expect(loud.volume).toBeCloseTo(0.8);

        channel.setVolume(0.5);

        expect(quiet.volume).toBeCloseTo(0.25);
        expect(loud.volume).toBeCloseTo(0.5);
    });

    it('stops every voice at once', async () =>
    {
        const first = createAudioStub();
        const second = createAudioStub();
        const factory = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
        const channel = new SoundboardChannel(factory as any);

        await channel.play('/sounds/first.mp3', 0.8);
        await channel.play('/sounds/second.mp3', 0.8);
        channel.stop();

        expect(first.pause).toHaveBeenCalledOnce();
        expect(second.pause).toHaveBeenCalledOnce();
    });

    it('replaces the current sound and fully unloads the previous element on a single voice', async () =>
    {
        const first = createAudioStub();
        const second = createAudioStub();
        const factory = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
        const channel = new SoundboardChannel(factory as any, 1);

        await expect(channel.play('/sounds/first.mp3', 0.8)).resolves.toBe(true);
        await expect(channel.play('https://cdn.example/second.mp3', 0.4)).resolves.toBe(true);

        expect(first.pause).toHaveBeenCalledOnce();
        expect(first.currentTime).toBe(0);
        expect(first.removeAttribute).toHaveBeenCalledWith('src');
        expect(first.load).toHaveBeenCalledOnce();
        expect(second.volume).toBe(0.4);
    });

    it('updates the active volume and cleans up a rejected play', async () =>
    {
        const audio = createAudioStub();
        audio.play.mockRejectedValueOnce(new Error('autoplay blocked'));
        const channel = new SoundboardChannel(() => audio as unknown as HTMLAudioElement);

        await expect(channel.play('/sounds/blocked.mp3', 0.8)).resolves.toBe(false);
        expect(audio.pause).toHaveBeenCalledOnce();
        expect(audio.removeAttribute).toHaveBeenCalledWith('src');

        const active = createAudioStub();
        const activeChannel = new SoundboardChannel(() => active as unknown as HTMLAudioElement);
        await activeChannel.play('/sounds/active.mp3', 0.8);
        activeChannel.setVolume(0.25);
        expect(active.volume).toBe(0.25);
    });
});
