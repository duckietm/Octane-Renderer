/**
 * Official `HabboSoundManagerFlash10` room object sounds (`RoomEngineObjectPlaySoundEvent`): the
 * sound id names one of the sound manager's own assets, and an id the manager does not know is not
 * played. The furniture ones ship with the sound manager (`FURNITURE_cuckoo_clock` is
 * `furniture_sounds/cuckoo_clock.mp3`), so they are bundled here instead of coming from `sounds.url`.
 */
const BUNDLED_SOUNDS = import.meta.glob<string>('./assets/*.mp3', { eager: true, import: 'default' });

/** Official `HabboSoundTypesEnum.FURNITURE_SOUND_CUCKOO_CLOCK`. */
export const FURNITURE_SOUND_CUCKOO_CLOCK = 'FURNITURE_cuckoo_clock';

/** Official `playSound`: the same sound asked again within 200 ms is dropped. */
export const ROOM_OBJECT_SOUND_REPEAT_MS = 200;

const soundNameFromPath = (path: string): string =>
{
    const fileName = path.substring(path.lastIndexOf('/') + 1);

    return fileName.substring(0, fileName.lastIndexOf('.'));
};

const BUNDLED_SOUND_URLS: Map<string, string> = new Map(Object.keys(BUNDLED_SOUNDS ?? {}).map(path => [ soundNameFromPath(path), BUNDLED_SOUNDS[path] ]));

/** The url of a bundled room object sound, or `null` when the official sound manager has no such asset. */
export const getRoomObjectSoundUrl = (soundId: string): string =>
{
    if(!soundId) return null;

    return BUNDLED_SOUND_URLS.get(soundId) ?? null;
};

/**
 * Official `HabboSoundWithPitch.setPitch` resamples the mono samples with a step of `pitch`, so the
 * sound gets both higher and shorter, which is a playback rate without pitch preservation. Browsers
 * accept rates from 1/16 to 16.
 */
export const clampPlaybackRate = (pitch: number): number =>
{
    if(!Number.isFinite(pitch) || (pitch <= 0)) return 1;

    return Math.min(16, Math.max(0.0625, pitch));
};
