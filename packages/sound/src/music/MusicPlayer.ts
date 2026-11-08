import { GetEventDispatcher, SoundManagerEvent } from '@octane/events';
import { OctaneLogger } from '@octane/utils';
import { TraxData } from '../trax/TraxData';
import { MusicAudio, MusicSample, MusicVoice, WebAudioMusicAudio } from './MusicAudio';

const MAX_CACHED_SAMPLES = 64;

export class MusicPlayer
{
    private _currentSong: TraxData | undefined;
    private _currentSongId: number;
    private _startPos: number;
    private _playLength: number;
    private _isPlaying: boolean;
    private _currentPos: number;
    private _cache: Map<number, MusicSample>;
    private _loading: Map<number, Promise<MusicSample>> = new Map();
    private _sampleUrl: string;

    private _tickerInterval: number | undefined;
    private _playGeneration: number = 0;
    private _sequence: ISequenceEntry[][];
    private _auditionSample: MusicSample | null = null;
    private _auditionVoice: MusicVoice | null = null;

    constructor(sampleUrl: string, private readonly _audio: MusicAudio = new WebAudioMusicAudio())
    {
        this._sampleUrl = sampleUrl;
        this._isPlaying = false;
        this._startPos = 0;
        this._currentPos = 0;
        this._playLength = 0;
        this._sequence = [];
        this._cache = new Map<number, MusicSample>();
    }

    public async play(song: string, currentSongId: number, startPos: number = 0, playLength: number = -1): Promise<void>
    {
        const nextSong = new TraxData(song);

        this.reset(new Set(nextSong.getSampleIds()));

        this._currentSong = nextSong;
        this._startPos = Math.trunc(startPos);
        this._playLength = playLength;
        this._currentPos = this._startPos;
        this._currentSongId = currentSongId;

        // A stop or a newer play while the samples load must win.
        const generation = this._playGeneration;

        await this.preload(generation);

        if(generation !== this._playGeneration) return;

        await this.unlockAudio();

        if(generation !== this._playGeneration) return;

        if(this._tickerInterval !== undefined) window.clearInterval(this._tickerInterval);
        this._isPlaying = true;
        this.tick();
        this._tickerInterval = window.setInterval(() => this.tick(), 1000);
    }

    /** Loads the samples of a song, then plays it, unless a newer request, a play or a stop came in meanwhile. */
    public async preloadAndPlay(song: string, currentSongId: number, startPos: number = 0, playLength: number = -1): Promise<void>
    {
        const generation = ++this._playGeneration;

        await this.preloadSamplesForSong(song);

        if(generation !== this._playGeneration) return;

        await this.play(song, currentSongId, startPos, playLength);
    }

    private reset(keepSampleIds: ReadonlySet<number> = new Set()): void
    {
        this._playGeneration++;
        this._isPlaying = false;
        window.clearInterval(this._tickerInterval);

        this._audio.stopAll();
        this.unloadSamples(keepSampleIds);
        this._currentSongId = -1;
        this._currentSong = undefined;
        this._tickerInterval = undefined;
        this._startPos = 0;
        this._playLength = 0;
        this._sequence = [];
        this._currentPos = 0;
    }

    public pause(): void
    {
        this._isPlaying = false;

        this._audio.stopAll();
    }

    public resume(): void
    {
        this._isPlaying = true;
    }

    /** Stops the song and its ticker without reporting it complete: nothing listens any more. */
    public dispose(): void
    {
        this.reset();
    }

    public stop(): void
    {
        const songId = this._currentSongId;
        this.reset();
        GetEventDispatcher().dispatchEvent(new SoundManagerEvent(SoundManagerEvent.TRAX_SONG_COMPLETE, songId));
    }

    public setVolume(volume: number): void
    {
        this._audio.setVolume(volume);
    }

    public getVolume(): number
    {
        return this._audio.getVolume();
    }

    public async getSample(id: number): Promise<MusicSample>
    {
        const sample = this._cache.get(id);

        if(sample) return sample;

        // Requests for a sample already loading share that load: a second copy would never be unloaded.
        if(!this._loading.has(id)) this._loading.set(id, this.loadSong(id).finally(() => this._loading.delete(id)));

        return this._loading.get(id);
    }

    public async playSampleOnce(sampleId: number): Promise<void>
    {
        this.stopSampleOnce();

        const sample = await this.getSample(sampleId);

        await this.unlockAudio();

        this._auditionSample = sample;
        this._auditionVoice = sample.play();
    }

    public stopSampleOnce(): void
    {
        this._auditionVoice?.stop();

        this._auditionSample = null;
        this._auditionVoice = null;
    }

    private async unlockAudio(): Promise<void>
    {
        if(this._audio.unlocked) return;

        await this._audio.unlock();
    }

    // Builds the sequence of the song selected when it started; a newer play or a stop while samples load discards it.
    private async preload(generation: number): Promise<void>
    {
        const song = this._currentSong;
        const sequence: ISequenceEntry[][] = [];

        this._sequence = [];

        if(!song) return;

        for(const channel of song.channels)
        {
            const sequenceEntryArray: ISequenceEntry[] = [];
            for(const sample of channel.items)
            {
                const isRestSample = (sample.id === -1) || (sample.id === 0);
                const sampleDuration = isRestSample ? 1 : Math.ceil((await this.getSample(sample.id)).duration);

                if(generation !== this._playGeneration) return;

                const sampleCount = Math.ceil((sample.length * 2) / sampleDuration);

                for(let i = 0; i < sampleCount; i++)
                {
                    for(let j = 0; j < sampleDuration; j++)
                    {
                        sequenceEntryArray.push({ sampleId: sample.id, offset: j });
                    }
                }
            }

            sequence.push(sequenceEntryArray);
        }

        this._sequence = sequence;

        if(this._playLength <= 0) this._playLength = Math.max(...sequence.map((value: ISequenceEntry[]) => value.length));
    }

    public async preloadSamplesForSong(song: string): Promise<void>
    {
        const traxData = new TraxData(song);

        await Promise.all(traxData.getSampleIds().filter(id => (id !== -1) && (id !== 0)).map(id => this.getSample(id)));
    }

    private async loadSong(songId: number): Promise<MusicSample>
    {
        let sample: MusicSample;

        try
        {
            sample = await this._audio.load(this._sampleUrl.replace('%sample%', songId.toString()));
        }
        catch (error)
        {
            OctaneLogger.error('failed to load sample ' + songId, error);

            throw new Error('failed to load sample ' + songId);
        }

        if(this._cache.size >= MAX_CACHED_SAMPLES) this.unloadSamples(this.currentSampleIds, 1);

        this._cache.set(songId, sample);

        return sample;
    }


    private get currentSampleIds(): ReadonlySet<number>
    {
        return new Set(this._currentSong ? this._currentSong.getSampleIds() : []);
    }

    // Frees decoded audio for cached samples the current song does not use,
    // oldest first; the audition sample is dropped with its cache entry.
    private unloadSamples(keepSampleIds: ReadonlySet<number>, limit: number = Infinity): void
    {
        for(const [id, sample] of this._cache)
        {
            if(limit <= 0) return;

            if(keepSampleIds.has(id)) continue;

            if(sample === this._auditionSample) this.stopSampleOnce();

            sample.unload();
            this._cache.delete(id);
            limit--;
        }
    }

    private tick(): void
    {
        if(this._currentPos > this._playLength - 1)
        {
            this.stop();
        }

        if(this._isPlaying)
        {
            if(this._currentSong)
            {
                this.playPosition(this._currentPos);
            }

            this._currentPos++;
        }
    }

    private playPosition(pos: number): void
    {
        if(!this._currentSong || !this._sequence) return;

        if(!this._audio.unlocked)
        {
            return;
        }

        for(const sequencyEntry of this._sequence)
        {
            const entry = sequencyEntry[pos];

            if(!entry) continue;

            if(entry.sampleId === -1 || entry.sampleId === 0) continue;

            const sampleAudio = this._cache.get(entry.sampleId);

            if(!sampleAudio) continue;

            if(entry.offset === 0)
            {
                sampleAudio.play();
            }
            else if(!sampleAudio.isPlaying())
            {
                sampleAudio.play(entry.offset);
            }
        }
    }

}

interface ISequenceEntry
{
    sampleId: number;
    offset: number;
}
