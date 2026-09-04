import { Texture } from 'pixi.js';
import { ImageFormat } from './ImageFormat';
import { assertSafeImage } from './ImageLimits';
import { DecodedRgbaImage, LoadedImageResource } from './ImageResource';

type NativeImageSource = ImageBitmap | HTMLImageElement | HTMLCanvasElement;

const MIME_BY_FORMAT: Partial<Record<ImageFormat, string>> = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    svg: 'image/svg+xml',
    bmp: 'image/bmp'
};

export interface StaticImageDecoderDependencies
{
    decodeNative(bytes: Uint8Array, mimeType: string, source: string): Promise<NativeImageSource>;
    decodeWebP(bytes: Uint8Array): Promise<DecodedRgbaImage>;
    decodeAvif(bytes: Uint8Array): Promise<DecodedRgbaImage>;
    canvasFromRgba(image: DecodedRgbaImage): HTMLCanvasElement;
    textureFrom(source: NativeImageSource): Texture;
}

export const decodeStaticImage = async (
    bytes: Uint8Array,
    format: ImageFormat,
    source: string,
    dependencies: StaticImageDecoderDependencies = DEFAULT_DEPENDENCIES
): Promise<LoadedImageResource> =>
{
    const mimeType = MIME_BY_FORMAT[format];

    if(!mimeType) throw new Error(`Unsupported static image format "${ format }"`);

    let imageSource: NativeImageSource;

    try
    {
        imageSource = await dependencies.decodeNative(bytes, mimeType, source);
    }
    catch (nativeError)
    {
        if(format !== 'webp' && format !== 'avif') throw nativeError;

        const decoded = format === 'webp'
            ? await dependencies.decodeWebP(bytes)
            : await dependencies.decodeAvif(bytes);

        validateDecodedRgba(decoded);
        imageSource = dependencies.canvasFromRgba(decoded);
    }

    assertSafeImage({ width: imageSource.width, height: imageSource.height });

    const texture = dependencies.textureFrom(imageSource);

    if(!texture) throw new Error(`Decoded image "${ source }" did not create a Pixi texture`);
    if(texture.source) texture.source.scaleMode = 'linear';
    if(texture.source) (texture.source as any).nitroFixedScaleMode = true;

    return {
        texture,
        format,
        animated: false,
        dispose: () => undefined
    };
};

export const decodeNativeBrowserImage = async (bytes: Uint8Array, mimeType: string, source: string): Promise<NativeImageSource> =>
{
    const blob = new Blob([ Uint8Array.from(bytes) ], { type: mimeType });
    let bitmapFailure: unknown = null;

    if(typeof createImageBitmap === 'function')
    {
        try
        {
            const bitmap = await createImageBitmap(blob);

            assertSafeImage({ width: bitmap.width, height: bitmap.height });

            return bitmap;
        }
        catch (error)
        {
            bitmapFailure = error;
        }
    }

    if(typeof Image === 'undefined' || typeof URL?.createObjectURL !== 'function')
        throw new Error(`No browser image decoder is available for "${ source }" (${ errorMessage(bitmapFailure) })`);

    const objectUrl = URL.createObjectURL(blob);

    try
    {
        return await new Promise<HTMLImageElement>((resolve, reject) =>
        {
            const image = new Image();

            image.crossOrigin = 'anonymous';
            image.onload = () =>
            {
                image.onload = null;
                image.onerror = null;

                if(!image.complete || image.width <= 0 || image.height <= 0)
                {
                    reject(new Error(`Browser decoded "${ source }" without valid dimensions`));
                    return;
                }

                resolve(image);
            };
            image.onerror = () =>
            {
                image.onload = null;
                image.onerror = null;
                reject(new Error(`Browser could not decode "${ source }" (${ errorMessage(bitmapFailure) })`));
            };
            image.src = objectUrl;
        });
    }
    finally
    {
        URL.revokeObjectURL(objectUrl);
    }
};

const decodeWebPFallback = async (bytes: Uint8Array): Promise<DecodedRgbaImage> =>
{
    const { decodeRGBA } = await import('wasm-webp');
    const decoded = await decodeRGBA(Uint8Array.from(bytes));

    if(!decoded) throw new Error('The WebP WebAssembly decoder returned no image');

    return { width: decoded.width, height: decoded.height, data: new Uint8ClampedArray(decoded.data) };
};

const decodeAvifFallback = async (bytes: Uint8Array): Promise<DecodedRgbaImage> =>
{
    const { decode } = await import('@jsquash/avif');
    const decoded = await decode(Uint8Array.from(bytes).buffer);

    if(!decoded) throw new Error('The AVIF WebAssembly decoder returned no image');

    return { width: decoded.width, height: decoded.height, data: decoded.data };
};

const canvasFromRgba = (image: DecodedRgbaImage): HTMLCanvasElement =>
{
    validateDecodedRgba(image);

    const canvas = document.createElement('canvas');

    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext('2d');

    if(!context) throw new Error('Could not create a 2D canvas context for decoded image data');

    const pixels = new Uint8ClampedArray(image.data.byteLength);

    pixels.set(image.data);

    context.putImageData(new ImageData(pixels, image.width, image.height), 0, 0);

    return canvas;
};

const validateDecodedRgba = (image: DecodedRgbaImage): void =>
{
    if(!image) throw new Error('Image decoder returned no RGBA data');

    assertSafeImage(image);

    const expectedBytes = image.width * image.height * 4;

    if(image.data?.byteLength !== expectedBytes)
        throw new Error(`Decoded RGBA byte length is invalid (expected ${ expectedBytes }, received ${ image.data?.byteLength ?? 0 })`);
};

const errorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error ?? 'unknown error');

const DEFAULT_DEPENDENCIES: StaticImageDecoderDependencies = {
    decodeNative: decodeNativeBrowserImage,
    decodeWebP: decodeWebPFallback,
    decodeAvif: decodeAvifFallback,
    canvasFromRgba,
    textureFrom: source => Texture.from(source)
};
