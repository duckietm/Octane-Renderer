import { OctaneLogger } from '@octane/utils';

/** One playback of a sample. */
export interface MusicVoice
{
    stop(): void;
}

/** A decoded trax sample. */
export interface MusicSample
{
    /** Length in seconds. */
    readonly duration: number;
    /** Starts another playback from `offset` seconds; playbacks of one sample may overlap. */
    play(offset?: number): MusicVoice;
    isPlaying(): boolean;
    /** Stops its playbacks and frees the decoded audio. */
    unload(): void;
}

/** The audio output the music player plays its samples through. */
export interface MusicAudio
{
    /** Rejects when the sample cannot be fetched or decoded. */
    load(url: string): Promise<MusicSample>;
    stopAll(): void;
    setVolume(volume: number): void;
    getVolume(): number;
    readonly unlocked: boolean;
    /** Resumes the output if the browser suspended it; resolves with whether it now runs. */
    unlock(): Promise<boolean>;
}

const UNLOCK_EVENTS = [ 'pointerdown', 'touchend', 'click', 'keydown' ];

/**
 * Web Audio output: one context and one master gain for every sample, so a volume change or a stop reaches all of
 * them at once. The context is created on the first load; a browser that starts it suspended is resumed on the next
 * user gesture, or by unlock().
 */
export class WebAudioMusicAudio implements MusicAudio
{
    private _context: AudioContext = null;
    private _master: GainNode = null;
    private _volume: number = 1;
    private _voices: Set<AudioBufferSourceNode> = new Set();

    constructor(private readonly _fetch: (url: string) => Promise<Response> = url => globalThis.fetch(url))
    {
        this.onUserGesture = this.onUserGesture.bind(this);
    }

    public async load(url: string): Promise<MusicSample>
    {
        const response = await this._fetch(url);

        if(!response.ok) throw new Error(`HTTP ${ response.status }`);

        const buffer = await this.context.decodeAudioData(await response.arrayBuffer());

        return this.createSample(buffer);
    }

    public stopAll(): void
    {
        for(const voice of [ ...this._voices ]) this.stopVoice(voice);
    }

    public setVolume(volume: number): void
    {
        this._volume = Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : 1));

        if(this._master) this._master.gain.setValueAtTime(this._volume, this._context.currentTime);
    }

    public getVolume(): number
    {
        return this._volume;
    }

    public get unlocked(): boolean
    {
        return (this._context?.state === 'running');
    }

    public async unlock(): Promise<boolean>
    {
        if(!this._context) return false;

        try
        {
            if(this._context.state !== 'running') await this._context.resume();
        }
        catch
        {
        }

        if(this.unlocked) this.removeUnlockListeners();

        return this.unlocked;
    }

    private get context(): AudioContext
    {
        if(this._context) return this._context;

        this._context = new AudioContext();
        this._master = this._context.createGain();
        this._master.gain.value = this._volume;
        this._master.connect(this._context.destination);

        if(this._context.state !== 'running') for(const type of UNLOCK_EVENTS) document.addEventListener(type, this.onUserGesture, true);

        return this._context;
    }

    private onUserGesture(): void
    {
        this.unlock().catch(error => OctaneLogger.error(error));
    }

    private removeUnlockListeners(): void
    {
        for(const type of UNLOCK_EVENTS) document.removeEventListener(type, this.onUserGesture, true);
    }

    private createSample(buffer: AudioBuffer): MusicSample
    {
        const voices: Set<AudioBufferSourceNode> = new Set();
        let decoded = buffer;

        return {
            duration: buffer.duration,
            play: (offset: number = 0) =>
            {
                if(!decoded) return { stop: () => undefined };

                const voice = this.context.createBufferSource();

                voice.buffer = decoded;
                voice.connect(this._master);
                voice.onended = () =>
                {
                    voices.delete(voice);
                    this._voices.delete(voice);
                    voice.disconnect();
                };

                voices.add(voice);
                this._voices.add(voice);
                voice.start(0, Math.max(0, Math.min(offset, decoded.duration)));

                return { stop: () => this.stopVoice(voice) };
            },
            isPlaying: () => (voices.size > 0),
            unload: () =>
            {
                for(const voice of [ ...voices ]) this.stopVoice(voice);

                decoded = null;
            }
        };
    }

    // Ending the voice runs its onended, which drops it from both sets.
    private stopVoice(voice: AudioBufferSourceNode): void
    {
        const onended = voice.onended as () => void;

        voice.onended = null;

        try
        {
            voice.stop();
        }
        catch
        {
        }

        onended?.();
    }
}
