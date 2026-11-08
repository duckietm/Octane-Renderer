import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { decodeGifAnimation, decodeGifImage } from './GifImageDecoder';

const createCanvasAnimatedResource = vi.hoisted(() => vi.fn());

vi.mock('./CanvasAnimatedTexture', () => ({ createCanvasAnimatedResource }));

/**
 * 4x4 screen, colours red / green / blue and a fourth used as the transparent index, loop extension 3:
 *  1. 4x4 red, keep, 100 ms
 *  2. 2x2 green at (1,1) whose first pixel is transparent, restore background, 200 ms
 *  3. 1x1 blue at (0,0), restore previous, 50 ms
 *  4. 1x1 blue at (3,3) with no control extension of its own, so it inherits the third one's
 */
const fixture = () =>
{
    const bytes = readFileSync(join(__dirname, '__fixtures__', 'disposal.gif'));

    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
};

const RED = [ 255, 0, 0, 255 ];
const GREEN = [ 0, 255, 0, 255 ];
const BLUE = [ 0, 0, 255, 255 ];
const CLEAR = [ 0, 0, 0, 0 ];

const pixel = (pixels: Uint8ClampedArray, x: number, y: number) => Array.from(pixels.subarray(((y * 4) + x) * 4, ((y * 4) + x + 1) * 4));

describe('decodeGifAnimation', () =>
{
    it('reads the screen size, every frame and its delay', () =>
    {
        const animation = decodeGifAnimation(fixture());

        expect(animation.width).toBe(4);
        expect(animation.height).toBe(4);
        expect(animation.frames.map(frame => frame.durationMs)).toEqual([ 100, 200, 50, 50 ]);
        expect(animation.frames.every(frame => frame.pixels.byteLength === 4 * 4 * 4)).toBe(true);
    });

    it('draws a patch over the previous frame and keeps what is under its transparent pixels', () =>
    {
        const { pixels } = decodeGifAnimation(fixture()).frames[1];

        expect(pixel(pixels, 1, 1)).toEqual(RED);
        expect(pixel(pixels, 2, 1)).toEqual(GREEN);
        expect(pixel(pixels, 2, 2)).toEqual(GREEN);
        expect(pixel(pixels, 0, 0)).toEqual(RED);
    });

    it('clears only the frame area on restore-background', () =>
    {
        const { pixels } = decodeGifAnimation(fixture()).frames[2];

        expect(pixel(pixels, 0, 0)).toEqual(BLUE);
        expect(pixel(pixels, 1, 1)).toEqual(CLEAR);
        expect(pixel(pixels, 2, 2)).toEqual(CLEAR);
        expect(pixel(pixels, 3, 0)).toEqual(RED);
        expect(pixel(pixels, 0, 3)).toEqual(RED);
    });

    it('puts the screen back on restore-previous, inherited by a frame without its own control extension', () =>
    {
        const { pixels } = decodeGifAnimation(fixture()).frames[3];

        expect(pixel(pixels, 0, 0)).toEqual(RED);
        expect(pixel(pixels, 3, 3)).toEqual(BLUE);
        expect(pixel(pixels, 1, 1)).toEqual(CLEAR);
    });

    it('loops forever like the previous decoder', () =>
    {
        expect(decodeGifAnimation(fixture()).loopCount).toBe(0);
    });

    it('rejects an empty buffer', () =>
    {
        expect(() => decodeGifAnimation(new ArrayBuffer(0))).toThrow(/empty/);
    });
});

describe('decodeGifImage', () =>
{
    it('plays the composed frames through the shared animated texture', () =>
    {
        const destroy = vi.fn();
        const texture = { source: { scaleMode: 'nearest' } };

        createCanvasAnimatedResource.mockReturnValue({ texture, dispose: destroy });

        const resource = decodeGifImage(new Uint8Array(fixture()));
        const [ animation, format ] = createCanvasAnimatedResource.mock.calls[0];

        expect(format).toBe('gif');
        expect(animation.frames).toHaveLength(4);
        expect(resource).toMatchObject({ texture, format: 'gif', animated: true });
        expect(texture.source.scaleMode).toBe('linear');

        resource.dispose();
        resource.dispose();

        expect(destroy).toHaveBeenCalledOnce();
    });
});
