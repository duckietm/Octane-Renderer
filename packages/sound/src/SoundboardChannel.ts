import { ISoundboardPlayOptions } from '@octane/api';
import { OctaneLogger } from '@octane/utils';

type AudioFactory = (url: string) => HTMLAudioElement;

interface SoundboardVoice
{
    audio: HTMLAudioElement;
    group: string;
    gain: number;
}

export class SoundboardChannel
{
    public static readonly DEFAULT_VOICES = 3;

    private _voices: SoundboardVoice[] = [];
    private readonly _maxVoices: number;

    constructor(private readonly _createAudio: AudioFactory = url => new Audio(url), maxVoices: number = SoundboardChannel.DEFAULT_VOICES)
    {
        this._maxVoices = Math.max(1, Math.floor(maxVoices));
    }

    public async play(url: string, volume: number, options: ISoundboardPlayOptions = {}): Promise<boolean>
    {
        if(!SoundboardChannel.isSafeUrl(url)) return false;

        const group = options.group?.trim() ?? '';

        if(group) this._voices.filter(voice => voice.group === group).forEach(voice => this.release(voice));

        while(this._voices.length >= this._maxVoices) this.release(this._voices[0]);

        const audio = this._createAudio(url.trim());
        const voice: SoundboardVoice = { audio, group, gain: SoundboardChannel.clampGain(options.gain) };

        audio.volume = SoundboardChannel.levelOf(volume, voice.gain);
        audio.currentTime = 0;
        audio.onended = () => this.release(voice);
        audio.onerror = () => this.release(voice);
        this._voices.push(voice);

        try
        {
            await audio.play();

            return this._voices.includes(voice);
        }
        catch (error)
        {
            OctaneLogger.error(error);
            this.release(voice);

            return false;
        }
    }

    public setVolume(volume: number): void
    {
        for(const voice of this._voices) voice.audio.volume = SoundboardChannel.levelOf(volume, voice.gain);
    }

    public stop(): void
    {
        [...this._voices].forEach(voice => this.release(voice));
    }

    private release(voice: SoundboardVoice): void
    {
        const index = this._voices.indexOf(voice);

        if(index >= 0) this._voices.splice(index, 1);

        this.disposeAudio(voice.audio);
    }

    private disposeAudio(audio: HTMLAudioElement): void
    {
        audio.onended = null;
        audio.onerror = null;

        try
        {
            audio.pause();
            audio.currentTime = 0;
            audio.removeAttribute('src');
            audio.load();
        }
        catch (error)
        {
            OctaneLogger.error(error);
        }
    }

    private static levelOf(volume: number, gain: number): number
    {
        return SoundboardChannel.clampVolume(volume) * gain;
    }

    private static clampVolume(volume: number): number
    {
        return Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : 0.8));
    }

    private static clampGain(gain: number | undefined): number
    {
        return Math.max(0, Math.min(1, Number.isFinite(gain) ? gain : 1));
    }

    private static isSafeUrl(url: string): boolean
    {
        if(!url?.trim()) return false;

        try
        {
            const parsed = new URL(url.trim(), 'https://octane.invalid');

            return (parsed.protocol === 'http:') || (parsed.protocol === 'https:');
        }
        catch
        {
            return false;
        }
    }
}
