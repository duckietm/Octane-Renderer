import { describe, expect, it, vi } from 'vitest';
import { ApngImageDecoderDependencies, decodeApngImage } from './ApngImageDecoder';
import { decodeGifImage } from './GifImageDecoder';
import { decodeAnimatedWebPImage, readWebPLoopCount, WebPImageDecoderDependencies } from './WebPImageDecoder';

vi.mock('pixi.js', () => ({
    Ticker: { shared: { add: vi.fn(), remove: vi.fn() } },
    Texture: { from: vi.fn() }
}));

describe('decodeGifImage', () =>
{
    it('wraps the GIF controller in an idempotent resource lifecycle', () =>
    {
        const destroy = vi.fn();
        const texture = { source: { scaleMode: 'nearest' } };
        const factory = vi.fn().mockReturnValue({ texture, destroy });
        const resource = decodeGifImage(new Uint8Array([ 1, 2, 3 ]), factory);

        expect(factory).toHaveBeenCalledOnce();
        expect(resource).toMatchObject({ texture, format: 'gif', animated: true });
        expect(texture.source.scaleMode).toBe('linear');

        resource.dispose();
        resource.dispose();

        expect(destroy).toHaveBeenCalledOnce();
    });
});

describe('decodeApngImage', () =>
{
    it('extracts fully composed frames, delays, and loop count from apng-js', async () =>
    {
        const renderNextFrame = vi.fn();
        const getImageData = vi.fn()
            .mockReturnValueOnce({ data: new Uint8ClampedArray([ 255, 0, 0, 255 ]) })
            .mockReturnValueOnce({ data: new Uint8ClampedArray([ 0, 0, 255, 128 ]) });
        const parsed = {
            width: 1,
            height: 1,
            numPlays: 2,
            frames: [ { delay: 5 }, { delay: 25 } ],
            createImages: vi.fn().mockResolvedValue(undefined),
            getPlayer: vi.fn().mockResolvedValue({ renderNextFrame, stop: vi.fn() })
        };
        const createAnimatedResource = vi.fn().mockReturnValue({ marker: 'apng-resource' });
        const dependencies = {
            parse: vi.fn().mockReturnValue(parsed),
            createContext: vi.fn().mockReturnValue({ getImageData }),
            createAnimatedResource
        } as unknown as ApngImageDecoderDependencies;

        const resource = await decodeApngImage(new Uint8Array([ 1 ]), dependencies);

        expect(parsed.createImages).toHaveBeenCalledOnce();
        expect(renderNextFrame).toHaveBeenCalledOnce();
        expect(createAnimatedResource).toHaveBeenCalledWith({
            width: 1,
            height: 1,
            loopCount: 2,
            frames: [
                { pixels: new Uint8ClampedArray([ 255, 0, 0, 255 ]), durationMs: 5 },
                { pixels: new Uint8ClampedArray([ 0, 0, 255, 128 ]), durationMs: 25 }
            ]
        }, 'png');
        expect(resource).toEqual({ marker: 'apng-resource' });
    });

    it('rejects parser errors instead of creating a broken animation', async () =>
    {
        const dependencies = {
            parse: vi.fn().mockReturnValue(new Error('invalid APNG'))
        } as unknown as ApngImageDecoderDependencies;

        await expect(decodeApngImage(new Uint8Array([ 2 ]), dependencies)).rejects.toThrow('invalid APNG');
    });
});

describe('decodeAnimatedWebPImage', () =>
{
    it('maps WebAssembly RGBA frames and the RIFF loop count to the shared animation resource', async () =>
    {
        const bytes = webPWithLoopCount(3);
        const frames = [
            { width: 1, height: 1, duration: 10, data: new Uint8Array([ 255, 0, 0, 255 ]) },
            { width: 1, height: 1, duration: 20, data: new Uint8Array([ 0, 255, 0, 255 ]) }
        ];
        const createAnimatedResource = vi.fn().mockReturnValue({ marker: 'webp-resource' });
        const dependencies = {
            decodeWasm: vi.fn().mockResolvedValue(frames),
            createAnimatedResource
        } as unknown as WebPImageDecoderDependencies;

        const resource = await decodeAnimatedWebPImage(bytes, dependencies);

        expect(createAnimatedResource).toHaveBeenCalledWith({
            width: 1,
            height: 1,
            loopCount: 3,
            frames: [
                { pixels: new Uint8ClampedArray([ 255, 0, 0, 255 ]), durationMs: 10 },
                { pixels: new Uint8ClampedArray([ 0, 255, 0, 255 ]), durationMs: 20 }
            ]
        }, 'webp');
        expect(resource).toEqual({ marker: 'webp-resource' });
    });

    it('rejects a WebAssembly decoder result with no frames', async () =>
    {
        const dependencies = {
            decodeWasm: vi.fn().mockResolvedValue(null),
            createAnimatedResource: vi.fn()
        } as unknown as WebPImageDecoderDependencies;

        await expect(decodeAnimatedWebPImage(webPWithLoopCount(0), dependencies)).rejects.toThrow(/no frames/i);
    });

    it('reads infinite and finite WebP loop counts from the ANIM chunk', () =>
    {
        expect(readWebPLoopCount(webPWithLoopCount(0))).toBe(0);
        expect(readWebPLoopCount(webPWithLoopCount(513))).toBe(513);
    });
});

const webPWithLoopCount = (loopCount: number): Uint8Array => new Uint8Array([
    0x52, 0x49, 0x46, 0x46,
    18, 0, 0, 0,
    0x57, 0x45, 0x42, 0x50,
    0x41, 0x4e, 0x49, 0x4d,
    6, 0, 0, 0,
    0, 0, 0, 0,
    loopCount & 0xff, (loopCount >> 8) & 0xff
]);
