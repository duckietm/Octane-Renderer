import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertSafeImage } from './ImageLimits';
import { decodeNativeBrowserImage, decodeStaticImage, StaticImageDecoderDependencies } from './StaticImageDecoder';

vi.mock('pixi.js', () => ({ Texture: { from: vi.fn() } }));

const createDependencies = (overrides: Partial<StaticImageDecoderDependencies> = {}): StaticImageDecoderDependencies =>
{
    const texture = { source: { scaleMode: 'nearest' } };

    return {
        decodeNative: vi.fn().mockResolvedValue({ width: 2, height: 3 }),
        decodeWebP: vi.fn().mockRejectedValue(new Error('WebP fallback should not run')),
        decodeAvif: vi.fn().mockRejectedValue(new Error('AVIF fallback should not run')),
        canvasFromRgba: vi.fn().mockImplementation(image => ({ width: image.width, height: image.height })),
        textureFrom: vi.fn().mockReturnValue(texture),
        ...overrides
    };
};

afterEach(() =>
{
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('assertSafeImage', () =>
{
    it('rejects dimensions above 8192 pixels', () =>
    {
        expect(() => assertSafeImage({ width: 8193, height: 1, frameCount: 1 })).toThrow(/8192/);
    });

    it('rejects more than 500 frames', () =>
    {
        expect(() => assertSafeImage({ width: 1, height: 1, frameCount: 501 })).toThrow(/500/);
    });

    it('rejects decoded RGBA memory above 256 MiB', () =>
    {
        expect(() => assertSafeImage({ width: 8192, height: 8192, frameCount: 2 })).toThrow(/256 MiB/);
    });
});

describe('decodeStaticImage', () =>
{
    it('uses native decoding first and returns a linear static texture resource', async () =>
    {
        const dependencies = createDependencies();
        const resource = await decodeStaticImage(new Uint8Array([ 1 ]), 'png', 'fixture.png', dependencies);

        expect(dependencies.decodeNative).toHaveBeenCalledWith(expect.any(Uint8Array), 'image/png', 'fixture.png');
        expect(dependencies.decodeWebP).not.toHaveBeenCalled();
        expect(resource).toMatchObject({ format: 'png', animated: false });
        expect(resource.texture.source.scaleMode).toBe('linear');
        expect(() => resource.dispose()).not.toThrow();
    });

    it('uses the WebP RGBA fallback only after native decoding fails', async () =>
    {
        const decoded = { width: 2, height: 1, data: new Uint8ClampedArray(8) };
        const dependencies = createDependencies({
            decodeNative: vi.fn().mockRejectedValue(new Error('native WebP unavailable')),
            decodeWebP: vi.fn().mockResolvedValue(decoded)
        });

        await decodeStaticImage(new Uint8Array([ 2 ]), 'webp', 'fixture.webp', dependencies);

        expect(dependencies.decodeWebP).toHaveBeenCalledOnce();
        expect(dependencies.canvasFromRgba).toHaveBeenCalledWith(decoded);
    });

    it('uses the AVIF RGBA fallback only after native decoding fails', async () =>
    {
        const decoded = { width: 1, height: 2, data: new Uint8ClampedArray(8) };
        const dependencies = createDependencies({
            decodeNative: vi.fn().mockRejectedValue(new Error('native AVIF unavailable')),
            decodeAvif: vi.fn().mockResolvedValue(decoded)
        });

        await decodeStaticImage(new Uint8Array([ 3 ]), 'avif', 'fixture.avif', dependencies);

        expect(dependencies.decodeAvif).toHaveBeenCalledOnce();
        expect(dependencies.canvasFromRgba).toHaveBeenCalledWith(decoded);
    });

    it('does not hide a native failure for formats without a bundled fallback', async () =>
    {
        const dependencies = createDependencies({ decodeNative: vi.fn().mockRejectedValue(new Error('invalid PNG')) });

        await expect(decodeStaticImage(new Uint8Array([ 4 ]), 'png', 'broken.png', dependencies)).rejects.toThrow('invalid PNG');
    });
});

describe('decodeNativeBrowserImage', () =>
{
    it('revokes the temporary object URL after the HTML image fallback loads', async () =>
    {
        const revokeObjectURL = vi.fn();

        vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('bitmap decoder unavailable')));
        vi.stubGlobal('URL', {
            ...URL,
            createObjectURL: vi.fn().mockReturnValue('blob:nitro-image'),
            revokeObjectURL
        });
        vi.stubGlobal('Image', class
        {
            public complete = true;
            public width = 2;
            public height = 1;
            public crossOrigin = '';
            public onload: (() => void) | null = null;
            public onerror: (() => void) | null = null;

            public set src(_value: string)
            {
                queueMicrotask(() => this.onload?.());
            }
        });

        const image = await decodeNativeBrowserImage(new Uint8Array([ 1, 2, 3 ]), 'image/png', 'fixture.png');

        expect(image).toMatchObject({ width: 2, height: 1 });
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:nitro-image');
    });
});
