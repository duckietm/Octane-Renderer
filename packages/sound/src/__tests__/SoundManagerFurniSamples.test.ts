import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomEngineObjectEvent, RoomEngineSamplePlaybackEvent } from '@octane/events';
import { SoundManager } from '../SoundManager';

vi.mock('../music/MusicController', () => ({
    MusicController: class
    {
        public init()
        {}
        public updateVolume()
        {}
    }
}));

vi.mock('@octane/configuration', () => ({ GetConfiguration: () => ({ getValue: () => '/samples/%sample%.mp3' }) }));

class FakeAudio
{
    public static created: FakeAudio[] = [];

    public volume = 1;
    public currentTime = 0;
    public playbackRate = 1;
    public defaultPlaybackRate = 1;
    public preservesPitch = true;
    public onended: () => void = null;
    public onerror: () => void = null;
    public play = vi.fn(() => Promise.resolve());
    public pause = vi.fn();

    constructor(public src: string)
    {
        FakeAudio.created.push(this);
    }

    public cloneNode(): FakeAudio
    {
        return new FakeAudio(this.src);
    }
}

const play = (manager: SoundManager, objectId: number, sampleId: number, pitch = 1) =>
    (manager as unknown as { onEvent(event: unknown): void }).onEvent(new RoomEngineSamplePlaybackEvent(RoomEngineSamplePlaybackEvent.PLAY_SAMPLE, 1, objectId, 10, sampleId, pitch));

const remove = (manager: SoundManager, objectId: number) =>
    (manager as unknown as { onEvent(event: unknown): void }).onEvent(new RoomEngineObjectEvent(RoomEngineObjectEvent.REMOVED, 1, objectId, 10));

/** One element per sample code was shared by every furni playing it, and the pitch was never applied. */
describe('furni samples', () =>
{
    beforeEach(() =>
    {
        FakeAudio.created = [];
        vi.stubGlobal('Audio', FakeAudio);
    });

    afterEach(() => vi.unstubAllGlobals());

    it('gives each furni its own instance, so removing one leaves the other playing', () =>
    {
        const manager = new SoundManager();

        play(manager, 1, 7);
        play(manager, 2, 7);

        const playing = FakeAudio.created.filter(audio => audio.play.mock.calls.length);

        expect(playing).toHaveLength(2);

        remove(manager, 1);

        expect(playing[0].pause).toHaveBeenCalled();
        expect(playing[1].pause).not.toHaveBeenCalled();
    });

    it('plays the sample at the pitch the furni asked for', () =>
    {
        const manager = new SoundManager();

        play(manager, 1, 7, 1.5);

        const instance = FakeAudio.created.find(audio => audio.play.mock.calls.length);

        expect(instance.playbackRate).toBe(1.5);
        expect(instance.preservesPitch).toBe(false);
    });

    it('forgets a furni whose sample ended, so a later removal stops nothing of another furni', () =>
    {
        const manager = new SoundManager();

        play(manager, 1, 7);
        const first = FakeAudio.created.find(audio => audio.play.mock.calls.length);

        first.onended();
        play(manager, 2, 7);
        remove(manager, 1);

        const second = FakeAudio.created.filter(audio => audio.play.mock.calls.length)[1];

        expect(second.pause).not.toHaveBeenCalled();
    });
});
