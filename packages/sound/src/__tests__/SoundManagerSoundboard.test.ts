import { describe, expect, it, vi } from 'vitest';
import { OctaneSettingsEvent, RoomEngineEvent } from '@octane/events';
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
        const settings = new OctaneSettingsEvent();
        settings.volumeSystem = 50;
        settings.volumeFurni = 50;
        settings.volumeTrax = 50;
        settings.volumeSoundboard = 35;

        (manager as any).onEvent(settings);

        expect(manager.soundboardVolume).toBe(0.35);
        expect(manager.getVolumesSnapshot()).not.toBe(first);
        expect(manager.getVolumesSnapshot().soundboard).toBe(0.35);
    });

    it('plays a preview on its own channel without touching what the room is playing', async () =>
    {
        const manager = new SoundManager();
        const room = { play: vi.fn().mockResolvedValue(true), stop: vi.fn(), setVolume: vi.fn() };
        const preview = { play: vi.fn().mockResolvedValue(true), stop: vi.fn(), setVolume: vi.fn() };
        (manager as any)._soundboardChannel = room;
        (manager as any)._soundboardPreviewChannel = preview;

        await manager.playSoundboardPreview('/sounds/try.mp3');
        await manager.playSoundboard('/sounds/bell.mp3', { group: 'bells', gain: 0.5 });
        manager.stopSoundboardPreview();

        expect(preview.play).toHaveBeenCalledWith('/sounds/try.mp3', 0.8);
        expect(room.play).toHaveBeenCalledWith('/sounds/bell.mp3', 0.8, { group: 'bells', gain: 0.5 });
        expect(preview.stop).toHaveBeenCalledOnce();
        expect(room.stop).not.toHaveBeenCalled();
    });

    it('applies the Soundboard volume setting to the room and the preview channel', () =>
    {
        const manager = new SoundManager();
        const room = { stop: vi.fn(), setVolume: vi.fn() };
        const preview = { stop: vi.fn(), setVolume: vi.fn() };
        (manager as any)._soundboardChannel = room;
        (manager as any)._soundboardPreviewChannel = preview;
        const settings = new OctaneSettingsEvent();
        settings.volumeSystem = 50;
        settings.volumeFurni = 50;
        settings.volumeTrax = 50;
        settings.volumeSoundboard = 20;

        (manager as any).onEvent(settings);

        expect(room.setVolume).toHaveBeenCalledWith(0.2);
        expect(preview.setVolume).toHaveBeenCalledWith(0.2);
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
