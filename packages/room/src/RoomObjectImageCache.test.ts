import { describe, expect, it, vi } from 'vitest';
import { TextureUtils } from '@octane/utils';
import { buildRoomObjectImageKey, RoomObjectImageCache, SharedImageResult } from './RoomObjectImageCache';

const fakeTexture = () => ({ destroyed: false, destroy: vi.fn(function (this: { destroyed: boolean }) { this.destroyed = true; }) });
const direction = { x: 2, y: 0, z: 0 } as any;

describe('buildRoomObjectImageKey', () => {
    it('joins every input that changes the render and normalises nulls', () => {
        const objectData = { getLegacyString: () => '3' } as any;
        expect(buildRoomObjectImageKey('chair', '1', direction, 64, null, null, -1, -1, null)).toBe('chair|1|2,0,0|64||||-1|-1|');
        expect(buildRoomObjectImageKey('chair', '1', direction, 64, 'x', objectData, 2, 3, 'sit')).toBe('chair|1|2,0,0|64|x|3|2|3|sit');
        expect(buildRoomObjectImageKey('chair', '1', { x: 4, y: 0, z: 0 } as any, 64, null, null, -1, -1, null)).not.toBe(buildRoomObjectImageKey('chair', '1', direction, 64, null, null, -1, -1, null));
    });
});

describe('RoomObjectImageCache', () => {
    it('returns the stored entry and keeps its texture', () => {
        const cache = new RoomObjectImageCache(2);
        const texture = fakeTexture();
        const entry = cache.set('a', texture as any);
        expect(cache.get('a')).toBe(entry);
        expect(entry.texture).toBe(texture);
        expect(cache.size).toBe(1);
    });

    it('evicts the least recently used entry and destroys its texture', () => {
        const cache = new RoomObjectImageCache(2);
        const a = fakeTexture(); const b = fakeTexture(); const c = fakeTexture();
        cache.set('a', a as any); cache.set('b', b as any);
        cache.get('a');
        cache.set('c', c as any);
        expect(cache.get('b')).toBeUndefined();
        expect(b.destroy).toHaveBeenCalledWith(true);
        expect(a.destroy).not.toHaveBeenCalled();
        expect(cache.size).toBe(2);
    });

    it('clear destroys every texture', () => {
        const cache = new RoomObjectImageCache(4);
        const a = fakeTexture(); const b = fakeTexture();
        cache.set('a', a as any); cache.set('b', b as any);
        cache.clear();
        expect(a.destroy).toHaveBeenCalledWith(true);
        expect(b.destroy).toHaveBeenCalledWith(true);
        expect(cache.size).toBe(0);
    });

    it('does not destroy a texture twice', () => {
        const cache = new RoomObjectImageCache(1);
        const a = fakeTexture(); a.destroyed = true;
        cache.set('a', a as any); cache.set('b', fakeTexture() as any);
        expect(a.destroy).not.toHaveBeenCalled();
    });

    it('memoises the extraction and retries after a null result', async () => {
        const image = { src: 'data:', width: 1, height: 1 } as HTMLImageElement;
        const spy = vi.spyOn(TextureUtils, 'generateImage').mockResolvedValueOnce(null).mockResolvedValue(image);
        const cache = new RoomObjectImageCache(1);
        const entry = cache.set('a', fakeTexture() as any);
        expect(await entry.getImage()).toBeNull();
        const first = entry.getImage(); const second = entry.getImage();
        expect(first).toBe(second);
        expect(await first).toBe(image);
        expect(spy).toHaveBeenCalledTimes(2);
        spy.mockRestore();
    });

    it('SharedImageResult exposes the entry texture and shares getImage', async () => {
        const image = { src: 'data:' } as HTMLImageElement;
        const spy = vi.spyOn(TextureUtils, 'generateImage').mockResolvedValue(image);
        const cache = new RoomObjectImageCache(1);
        const entry = cache.set('a', fakeTexture() as any);
        const result = new SharedImageResult(entry, 7);
        expect(result.id).toBe(7);
        expect(result.data).toBe(entry.texture);
        expect(result.image).toBeNull();
        expect(await result.getImage()).toBe(image);
        expect(await new SharedImageResult(entry).getImage()).toBe(image);
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });
});
