import { IMusicController } from './IMusicController';
import { ISoundVolumesSnapshot } from './ISoundVolumesSnapshot';
import { ISoundboardPlayOptions } from './ISoundboardPlayOptions';

export interface ISoundManager
{
    init(): Promise<void>;
    musicController: IMusicController;
    traxVolume: number;
    systemVolume: number;
    furniVolume: number;
    soundboardVolume: number;
    playSoundboard(url: string, options?: ISoundboardPlayOptions): Promise<boolean>;
    stopSoundboard(): void;

    /**
     * Plays a pad for the person listening only, on a channel of its own, so trying a
     * clip never cuts what the room is playing.
     */
    playSoundboardPreview(url: string): Promise<boolean>;
    stopSoundboardPreview(): void;

    /**
     * Returns a referentially-stable snapshot of the three volume
     * levels (system / furni / trax / soundboard). The same reference is returned
     * across reads until a volume changes; mutations dispatch
     * `OctaneEventType.SOUND_VOLUMES_UPDATED` to signal invalidation.
     *
     * Pairs with `useSyncExternalStore` on the React client for
     * volume-slider widgets.
     */
    getVolumesSnapshot(): Readonly<ISoundVolumesSnapshot>;
}
