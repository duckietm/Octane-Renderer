import { IAdvancedMap, IMusicController, IOctaneEvent, ISoundManager, ISoundVolumesSnapshot, ISoundboardPlayOptions } from '@octane/api';
import { GetConfiguration } from '@octane/configuration';
import { GetEventDispatcher, OctaneEvent, OctaneEventType, OctaneSettingsEvent, OctaneSoundEvent, RoomEngineEvent, RoomEngineObjectEvent, RoomEngineObjectPlaySoundEvent, RoomEngineSamplePlaybackEvent } from '@octane/events';
import { AdvancedMap, OctaneLogger } from '@octane/utils';
import { MusicController } from './music/MusicController';
import { ROOM_OBJECT_SOUND_REPEAT_MS, clampPlaybackRate, getRoomObjectSoundUrl } from './RoomObjectSounds';
import { SoundboardChannel } from './SoundboardChannel';

export class SoundManager implements ISoundManager
{
    private _volumeSystem: number = 0.5;
    private _volumeFurni: number = 0.5;
    private _volumeTrax: number = 0.5;
    private _volumeSoundboard: number = 0.8;
    private _volumesSnapshot: Readonly<ISoundVolumesSnapshot> | null = null;

    private _internalSamples: IAdvancedMap<string, HTMLAudioElement> = new AdvancedMap();
    private _furniSamples: IAdvancedMap<number, HTMLAudioElement> = new AdvancedMap();
    // One playing instance per furni, cloned from the sample cached per code: a single element per code was shared by
    // every furni playing it, so removing one stopped the others and its handlers pointed at the last furni only.
    private _furniPlaying: Map<number, HTMLAudioElement> = new Map();
    private _roomObjectSounds: Map<string, HTMLAudioElement> = new Map();
    private _roomObjectSoundPlayedAt: Map<string, number> = new Map();

    private _musicController: IMusicController = new MusicController();
    private _soundboardChannel = new SoundboardChannel();
    private _soundboardPreviewChannel = new SoundboardChannel(undefined, 1);
    private _eventCallback: (event: IOctaneEvent) => void = null;

    public async init(): Promise<void>
    {
        // A second init registered every listener again and lost the first set, which could no longer be removed.
        if(this._eventCallback) return;

        this._musicController.init();

        // Store callback for cleanup
        this._eventCallback = (event: IOctaneEvent) => this.onEvent(event);

        GetEventDispatcher().addEventListener<RoomEngineSamplePlaybackEvent>(RoomEngineSamplePlaybackEvent.PLAY_SAMPLE, this._eventCallback);
        GetEventDispatcher().addEventListener<RoomEngineObjectEvent>(RoomEngineObjectEvent.REMOVED, this._eventCallback);
        GetEventDispatcher().addEventListener<RoomEngineEvent>(RoomEngineEvent.DISPOSED, this._eventCallback);
        GetEventDispatcher().addEventListener<OctaneSettingsEvent>(OctaneSettingsEvent.SETTINGS_UPDATED, this._eventCallback);
        GetEventDispatcher().addEventListener<OctaneSoundEvent>(OctaneSoundEvent.PLAY_SOUND, this._eventCallback);
        GetEventDispatcher().addEventListener<RoomEngineObjectPlaySoundEvent>(RoomEngineObjectPlaySoundEvent.PLAY_SOUND, this._eventCallback);
        GetEventDispatcher().addEventListener<RoomEngineObjectPlaySoundEvent>(RoomEngineObjectPlaySoundEvent.PLAY_SOUND_AT_PITCH, this._eventCallback);
    }

    public dispose(): void
    {
        if(this._eventCallback)
        {
            GetEventDispatcher().removeEventListener(RoomEngineSamplePlaybackEvent.PLAY_SAMPLE, this._eventCallback);
            GetEventDispatcher().removeEventListener(RoomEngineObjectEvent.REMOVED, this._eventCallback);
            GetEventDispatcher().removeEventListener(RoomEngineEvent.DISPOSED, this._eventCallback);
            GetEventDispatcher().removeEventListener(OctaneSettingsEvent.SETTINGS_UPDATED, this._eventCallback);
            GetEventDispatcher().removeEventListener(OctaneSoundEvent.PLAY_SOUND, this._eventCallback);
            GetEventDispatcher().removeEventListener(RoomEngineObjectPlaySoundEvent.PLAY_SOUND, this._eventCallback);
            GetEventDispatcher().removeEventListener(RoomEngineObjectPlaySoundEvent.PLAY_SOUND_AT_PITCH, this._eventCallback);
            this._eventCallback = null;
        }

        // Stop all playing samples
        this.stopAllFurniSamples();

        // Clear all samples. reset() keeps the maps usable: dispose() dropped their storage, and the first sound after
        // a later init threw.
        this._internalSamples.reset();
        this._furniSamples.reset();
        this._roomObjectSounds.forEach(sample => sample.pause());
        this._roomObjectSounds.clear();
        this._roomObjectSoundPlayedAt.clear();
        this.stopSoundboard();
        this.stopSoundboardPreview();
    }

    private onEvent(event: IOctaneEvent)
    {
        switch(event.type)
        {
            case RoomEngineSamplePlaybackEvent.PLAY_SAMPLE: {
                const castedEvent = (event as RoomEngineSamplePlaybackEvent);

                this.playFurniSample(castedEvent.objectId, castedEvent.sampleId, castedEvent.pitch);
                return;
            }
            case RoomEngineObjectEvent.REMOVED: {
                const castedEvent = (event as RoomEngineObjectEvent);

                this.stopFurniSample(castedEvent.objectId);
                return;
            }
            case RoomEngineEvent.DISPOSED: {
                this.stopAllFurniSamples();
                this.stopSoundboard();
                return;
            }
            case OctaneSettingsEvent.SETTINGS_UPDATED: {
                const castedEvent = (event as OctaneSettingsEvent);

                const nextSystem = (castedEvent.volumeSystem / 100);
                const nextFurni = (castedEvent.volumeFurni / 100);
                const nextTrax = (castedEvent.volumeTrax / 100);
                const nextSoundboard = Number.isFinite(castedEvent.volumeSoundboard)
                    ? (castedEvent.volumeSoundboard / 100)
                    : this._volumeSoundboard;

                const volumeSystemUpdated = nextSystem !== this._volumeSystem;
                const volumeFurniUpdated = nextFurni !== this._volumeFurni;
                const volumeTraxUpdated = nextTrax !== this._volumeTrax;
                const volumeSoundboardUpdated = nextSoundboard !== this._volumeSoundboard;

                this._volumeSystem = nextSystem;
                this._volumeFurni = nextFurni;
                this._volumeTrax = nextTrax;
                this._volumeSoundboard = nextSoundboard;

                if(volumeFurniUpdated) this.updateFurniSamplesVolume(this._volumeFurni);

                if(volumeTraxUpdated) this._musicController?.updateVolume(this._volumeTrax);

                if(volumeSoundboardUpdated)
                {
                    this._soundboardChannel.setVolume(this._volumeSoundboard);
                    this._soundboardPreviewChannel.setVolume(this._volumeSoundboard);
                }

                if(volumeSystemUpdated || volumeFurniUpdated || volumeTraxUpdated || volumeSoundboardUpdated) this.invalidateVolumesSnapshot();

                return;
            }
            case OctaneSoundEvent.PLAY_SOUND: {
                const castedEvent = (event as OctaneSoundEvent);

                this.playInternalSample(castedEvent.sampleCode);
                return;
            }
            case RoomEngineObjectPlaySoundEvent.PLAY_SOUND: {
                this.playRoomObjectSound((event as RoomEngineObjectPlaySoundEvent).soundId);
                return;
            }
            case RoomEngineObjectPlaySoundEvent.PLAY_SOUND_AT_PITCH: {
                const castedEvent = (event as RoomEngineObjectPlaySoundEvent);

                this.playRoomObjectSoundAtPitch(castedEvent.soundId, castedEvent.pitch);
                return;
            }
        }
    }

    private playSample(sample: HTMLAudioElement, volume: number): void
    {
        sample.volume = volume;
        sample.currentTime = 0;

        try
        {
            const playing = sample.play();

            // A browser blocking autoplay rejects the promise; that is not an error worth a stack trace.
            if(playing && (typeof playing.catch === 'function')) playing.catch(() => undefined);
        }
        catch (e)
        {
            OctaneLogger.error(e);
        }
    }

    private playInternalSample(code: string): void
    {
        let sample = this._internalSamples.getValue(code);

        if(!sample)
        {
            const sampleUrl = GetConfiguration().getValue<string>('sounds.url');

            sample = new Audio(sampleUrl.replace('%sample%', code));
            this._internalSamples.add(code, sample);
        }

        this.playSample(sample, this._volumeSystem);
    }

    private playFurniSample(objectId: number, code: number, pitch: number): void
    {
        let template = this._furniSamples.getValue(code);

        if(!template)
        {
            const sampleUrl = GetConfiguration().getValue<string>('external.samples.url');

            template = new Audio(sampleUrl.replace('%sample%', code.toString()));
            this._furniSamples.add(code, template);
        }

        this.stopFurniSample(objectId);

        const sample = (typeof template.cloneNode === 'function') ? (template.cloneNode() as HTMLAudioElement) : new Audio(template.src);
        const rate = clampPlaybackRate(pitch);

        // The pitch the furni asked for, which was never applied.
        sample.preservesPitch = false;
        sample.defaultPlaybackRate = rate;
        sample.playbackRate = rate;

        const finished = () =>
        {
            if(this._furniPlaying.get(objectId) === sample) this._furniPlaying.delete(objectId);
        };

        sample.onended = finished;
        sample.onerror = finished;

        this._furniPlaying.set(objectId, sample);
        this.playSample(sample, this._volumeFurni);
    }

    /**
     * Official `HabboSoundManagerFlash10.playSound`: one cached sound per id at the generic (system)
     * volume, and the same id asked again within 200 ms is dropped.
     */
    private playRoomObjectSound(soundId: string): void
    {
        const url = getRoomObjectSoundUrl(soundId);

        if(!url) return;

        const now = Date.now();
        const playedAt = this._roomObjectSoundPlayedAt.get(soundId);

        if((playedAt !== undefined) && ((now - playedAt) <= ROOM_OBJECT_SOUND_REPEAT_MS)) return;

        let sample = this._roomObjectSounds.get(soundId);

        if(!sample)
        {
            sample = new Audio(url);
            this._roomObjectSounds.set(soundId, sample);
        }

        this._roomObjectSoundPlayedAt.set(soundId, now);
        this.playSample(sample, this._volumeSystem);
    }

    /**
     * Official `HabboSoundManagerFlash10` PLAY_SOUND_AT_PITCH: a new `HabboSoundWithPitch` per call, so
     * calls overlap, resampled by `pitch` (higher and shorter) at the generic (system) volume.
     */
    private playRoomObjectSoundAtPitch(soundId: string, pitch: number): void
    {
        const url = getRoomObjectSoundUrl(soundId);

        if(!url) return;

        const sample = new Audio(url);

        const rate = clampPlaybackRate(pitch);

        sample.preservesPitch = false;
        // The default rate too: loading the source resets `playbackRate` to it.
        sample.defaultPlaybackRate = rate;
        sample.playbackRate = rate;

        this.playSample(sample, this._volumeSystem);
    }

    private stopInternalSample(code: string): void
    {
        const sample = this._internalSamples.getValue(code);

        if(!sample) return;

        try
        {
            sample.pause();
        }
        catch (e)
        {
            OctaneLogger.error(e);
        }
    }

    private stopAllFurniSamples(): void
    {
        for(const objectId of [ ...this._furniPlaying.keys() ]) this.stopFurniSample(objectId);
    }

    private stopFurniSample(objectId: number): void
    {
        const sample = this._furniPlaying.get(objectId);

        if(!sample) return;

        this._furniPlaying.delete(objectId);
        sample.onended = null;
        sample.onerror = null;

        try
        {
            sample.pause();
        }
        catch (e)
        {
            OctaneLogger.error(e);
        }
    }

    private updateInternalSamplesVolume(volume: number): void
    {
        this._internalSamples.getValues().forEach((sample: HTMLAudioElement) =>
        {
            sample.volume = volume;
        });
    }

    private updateFurniSamplesVolume(volume: number): void
    {
        this._furniPlaying.forEach((sample: HTMLAudioElement) =>
        {
            sample.volume = volume;
        });
    }

    public get traxVolume(): number
    {
        return this._volumeTrax;
    }

    public get systemVolume(): number
    {
        return this._volumeSystem;
    }

    public get furniVolume(): number
    {
        return this._volumeFurni;
    }

    public get soundboardVolume(): number
    {
        return this._volumeSoundboard;
    }

    public playSoundboard(url: string, options?: ISoundboardPlayOptions): Promise<boolean>
    {
        return this._soundboardChannel.play(url, this._volumeSoundboard, options);
    }

    public stopSoundboard(): void
    {
        this._soundboardChannel.stop();
    }

    public playSoundboardPreview(url: string): Promise<boolean>
    {
        return this._soundboardPreviewChannel.play(url, this._volumeSoundboard);
    }

    public stopSoundboardPreview(): void
    {
        this._soundboardPreviewChannel.stop();
    }

    public get musicController(): IMusicController
    {
        return this._musicController;
    }

    private invalidateVolumesSnapshot(): void
    {
        this._volumesSnapshot = null;

        GetEventDispatcher().dispatchEvent(new OctaneEvent(OctaneEventType.SOUND_VOLUMES_UPDATED));
    }

    public getVolumesSnapshot(): Readonly<ISoundVolumesSnapshot>
    {
        if(this._volumesSnapshot) return this._volumesSnapshot;

        this._volumesSnapshot = Object.freeze<ISoundVolumesSnapshot>({
            system: this._volumeSystem,
            furni: this._volumeFurni,
            trax: this._volumeTrax,
            soundboard: this._volumeSoundboard
        });

        return this._volumesSnapshot;
    }
}
