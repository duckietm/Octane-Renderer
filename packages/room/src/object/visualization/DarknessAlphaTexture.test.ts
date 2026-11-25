import { Texture } from 'pixi.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { extractDarknessToAlpha, GetDarknessAlphaTexture } from './DarknessAlphaTexture';

describe('extractDarknessToAlpha', () =>
{
    it('keeps light pixels as they are', () =>
    {
        const pixels = new Uint8ClampedArray([ 255, 255, 255, 255, 255, 200, 200, 200 ]);

        extractDarknessToAlpha(pixels);

        expect(Array.from(pixels)).toEqual([ 255, 255, 255, 255, 255, 200, 200, 200 ]);
    });

    it('turns black into transparency', () =>
    {
        const pixels = new Uint8ClampedArray([ 0, 0, 0, 255 ]);

        extractDarknessToAlpha(pixels);

        expect(pixels[3]).toBe(0);
    });

    it('lifts a dark colour to lightness 128 and fades it by how dark it was', () =>
    {
        const pixels = new Uint8ClampedArray([ 64, 0, 0, 255 ]);

        extractDarknessToAlpha(pixels);

        // A dark red (lightness 32) becomes the full red of lightness 128 at a quarter of its alpha.
        expect(pixels[0]).toBeGreaterThan(200);
        expect(pixels[1]).toBeLessThan(10);
        expect(pixels[2]).toBeLessThan(10);
        expect(pixels[3]).toBe(63);
    });
});

describe('GetDarknessAlphaTexture', () =>
{
    afterEach(() => vi.restoreAllMocks());

    it('returns the layer itself when it has no readable image', () =>
    {
        expect(GetDarknessAlphaTexture(Texture.EMPTY)).toBe(Texture.EMPTY);
        expect(GetDarknessAlphaTexture(null)).toBeNull();
    });

    it('makes one texture per layer and drops it with the layer', () =>
    {
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function(this: HTMLCanvasElement)
        {
            return {
                drawImage: () => undefined,
                getImageData: (_x: number, _y: number, width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }),
                putImageData: () => undefined,
                canvas: this
            } as unknown as CanvasRenderingContext2D;
        } as never);

        const canvas = document.createElement('canvas');

        canvas.width = 3;
        canvas.height = 2;

        const texture = Texture.from(canvas, true);
        const result = GetDarknessAlphaTexture(texture);

        expect(result).not.toBe(texture);
        expect([ result.width, result.height ]).toEqual([ 3, 2 ]);
        expect(GetDarknessAlphaTexture(texture)).toBe(result);

        texture.destroy();

        expect(result.destroyed).toBe(true);
    });
});
