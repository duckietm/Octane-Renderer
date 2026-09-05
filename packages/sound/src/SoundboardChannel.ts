import { OctaneLogger } from '@octane/utils';

type AudioFactory = (url: string) => HTMLAudioElement;

export class SoundboardChannel
{
    private _audio: HTMLAudioElement = null;

    constructor(private readonly _createAudio: AudioFactory = url => new Audio(url))
    {}

    public async play(url: string, volume: number): Promise<boolean>
    {
        if(!SoundboardChannel.isSafeUrl(url)) return false;

        this.stop();

        const audio = this._createAudio(url.trim());
        audio.volume = SoundboardChannel.clampVolume(volume);
        audio.currentTime = 0;
        audio.onended = () => this.release(audio);
        audio.onerror = () => this.release(audio);
        this._audio = audio;

        try
        {
            await audio.play();

            return this._audio === audio;
        }
        catch (error)
        {
            OctaneLogger.error(error);
            this.release(audio);

            return false;
        }
    }

    public setVolume(volume: number): void
    {
        if(this._audio) this._audio.volume = SoundboardChannel.clampVolume(volume);
    }

    public stop(): void
    {
        const audio = this._audio;

        if(!audio) return;

        this._audio = null;
        this.disposeAudio(audio);
    }

    private release(audio: HTMLAudioElement): void
    {
        if(this._audio === audio) this._audio = null;

        this.disposeAudio(audio);
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

    private static clampVolume(volume: number): number
    {
        return Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : 0.8));
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
