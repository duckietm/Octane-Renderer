import { describe, expect, it, vi } from 'vitest';
import { NitroSettingsEvent, RoomEngineEvent } from '@nitrots/events';
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

describe('SoundManager Soundboard channel', () =>
{
    it('exposes Soundboard volume in the stable snapshot', () =>
    {
        const manager = new SoundManager();
        const first = manager.getVolumesSnapshot();

        expect(first.soundboard).toBe(0.8);
        expect(manager.getVolumesSnapshot()).toBe(first);
    });

    it('updates the channel volume from settings and invalidates the snapshot', () =>
    {
        const manager = new SoundManager();
        const first = manager.getVolumesSnapshot();
        const settings = new NitroSettingsEvent();
        settings.volumeSystem = 50;
        settings.volumeFurni = 50;
        settings.volumeTrax = 50;
        settings.volumeSoundboard = 35;

        (manager as any).onEvent(settings);

        expect(manager.soundboardVolume).toBe(0.35);
        expect(manager.getVolumesSnapshot()).not.toBe(first);
        expect(manager.getVolumesSnapshot().soundboard).toBe(0.35);
    });

    it('stops Soundboard audio when the room is disposed', () =>
    {
        const manager = new SoundManager();
        let stops = 0;
        (manager as any)._soundboardChannel = { stop: () => stops++, setVolume: () => undefined };

        (manager as any).onEvent(new RoomEngineEvent(RoomEngineEvent.DISPOSED, 1));

        expect(stops).toBe(1);
    });
});
