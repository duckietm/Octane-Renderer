import { Texture } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateHalfSizeTexture, HalfSizeTextureCache, ResampleHalfSize } from './HalfSizeTexture';

const rgba = (pixels: number[][]): Uint8ClampedArray => new Uint8ClampedArray(pixels.flat());
const pixel = (data: Uint8ClampedArray, width: number, x: number, y: number): number[] => Array.from(data.slice(((y * width) + x) * 4, ((y * width) + x) * 4 + 4));

const RED = [ 200, 40, 40, 255 ];
const BLUE = [ 40, 40, 200, 255 ];
const NONE = [ 0, 0, 0, 0 ];

describe('ResampleHalfSize', () =>
{
    it('halves a 2x2 block into the bilinear average at its centre', () =>
    {
        const { data, width, height } = ResampleHalfSize(rgba([ RED, BLUE, BLUE, RED ]), 2, 2);

        expect([ width, height ]).toEqual([ 1, 1 ]);
        expect(pixel(data, 1, 0, 0)).toEqual([ 120, 40, 120, 255 ]);
    });

    it('averages colours by alpha, so a transparent neighbour does not darken the colour', () =>
    {
        const { data } = ResampleHalfSize(rgba([ RED, NONE, NONE, RED ]), 2, 2);

        expect(pixel(data, 1, 0, 0)).toEqual([ 200, 40, 40, 128 ]);
    });

    it('rounds odd sizes (round(w/2) x round(h/2), never below one pixel)', () =>
    {
        expect(ResampleHalfSize(rgba([ RED, RED, RED ]), 3, 1)).toMatchObject({ width: 2, height: 1 });
        expect(ResampleHalfSize(rgba([ RED ]), 1, 1)).toMatchObject({ width: 1, height: 1 });
    });

    it('leaves fully transparent areas transparent', () =>
    {
        expect(pixel(ResampleHalfSize(rgba([ NONE, NONE, NONE, NONE ]), 2, 2).data, 1, 0, 0)).toEqual(NONE);
    });
});

describe('HalfSizeTextureCache', () =>
{
    let readable = true;

    beforeEach(() =>
    {
        vi.useFakeTimers();
        readable = true;

        // jsdom has no 2d canvas: a minimal one returns opaque red pixels.
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function(this: HTMLCanvasElement)
        {
            return {
                drawImage: () =>
                {
                    if(!readable) throw new Error('tainted');
                },
                getImageData: (_x: number, _y: number, width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4).fill(255) }),
                createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4), width, height }),
                putImageData: () => undefined,
                canvas: this
            } as unknown as CanvasRenderingContext2D;
        } as never);
    });

    afterEach(() =>
    {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    const createTexture = (width: number, height: number): Texture =>
    {
        const canvas = document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;

        return Texture.from(canvas, true);
    };

    it('builds the half-size texture off the render path and returns it on a later call', () =>
    {
        const cache = new HalfSizeTextureCache(4);
        const texture = createTexture(8, 6);

        expect(cache.getTexture('h_fx_1', texture)).toBeNull();
        expect(cache.getTexture('h_fx_1', texture)).toBeNull();

        vi.runAllTimers();

        const half = cache.getTexture('h_fx_1', texture);

        expect(half).not.toBeNull();
        expect([ half.width, half.height ]).toEqual([ 4, 3 ]);
        expect(cache.getTexture('h_fx_1', texture)).toBe(half);
    });

    it('makes the texture again when the name now draws another texture, and destroys the old one', () =>
    {
        const cache = new HalfSizeTextureCache(4);
        const first = createTexture(4, 4);

        cache.getTexture('h_fx_1', first);
        vi.runAllTimers();

        const oldHalf = cache.getTexture('h_fx_1', first);

        expect(cache.getTexture('h_fx_1', createTexture(4, 4))).toBeNull();
        expect(oldHalf.destroyed).toBe(true);
    });

    it('destroys the least recently used texture beyond its size', () =>
    {
        const cache = new HalfSizeTextureCache(2);
        const textures = [ createTexture(2, 2), createTexture(2, 2), createTexture(2, 2) ];

        textures.forEach((texture, index) => cache.getTexture(`fx_${ index }`, texture));
        vi.runAllTimers();

        expect(cache.size).toBe(2);
        expect(cache.getTexture('fx_0', textures[0])).toBeNull();
    });

    it('remembers a texture whose pixels cannot be read and does not try again', () =>
    {
        readable = false;

        const cache = new HalfSizeTextureCache(4);
        const texture = createTexture(4, 4);

        cache.getTexture('h_fx_1', texture);
        vi.runAllTimers();

        expect(cache.hasFailed(texture)).toBe(true);
        expect(cache.getTexture('h_fx_1', texture)).toBeNull();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('CreateHalfSizeTexture gives null for a texture without an image', () =>
    {
        expect(CreateHalfSizeTexture(null)).toBeNull();
        expect(CreateHalfSizeTexture(Texture.EMPTY)).toBeNull();
    });
});
