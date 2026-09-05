import { IMusicController } from './IMusicController';
import { ISoundVolumesSnapshot } from './ISoundVolumesSnapshot';

export interface ISoundManager
{
    init(): Promise<void>;
    musicController: IMusicController;
    traxVolume: number;
    systemVolume: number;
    furniVolume: number;
    soundboardVolume: number;
    playSoundboard(url: string): Promise<boolean>;
    stopSoundboard(): void;

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
