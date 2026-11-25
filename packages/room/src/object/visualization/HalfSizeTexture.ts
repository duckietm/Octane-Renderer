import { Texture } from 'pixi.js';

/**
 * Half-size copies of room textures, as AIR draws them in the zoomed-out room.
 * Ported from plus-emulator/volt-renderer (by Dennis, GPL-3.0).
 */

export interface IHalfSizeResample
{
    data: Uint8ClampedArray;
    width: number;
    height: number;
}

/**
 * The pixel step of AIR `resampleBitmapData(bitmap, 0.5)` on straight-alpha RGBA: a round(w/2) x round(h/2) image,
 * each pixel bilinearly sampled at its centre, colours averaged by alpha (premultiplied).
 */
export const ResampleHalfSize = (pixels: Uint8ClampedArray, width: number, height: number): IHalfSizeResample =>
{
    const targetWidth = Math.max(1, Math.round(width * 0.5));
    const targetHeight = Math.max(1, Math.round(height * 0.5));
    const scaleX = (targetWidth / width);
    const scaleY = (targetHeight / height);
    const data = new Uint8ClampedArray(targetWidth * targetHeight * 4);

    for(let y = 0; y < targetHeight; y++)
    {
        const sourceY = (((y + 0.5) / scaleY) - 0.5);
        const y0 = Math.floor(sourceY);
        const ty = (sourceY - y0);

        for(let x = 0; x < targetWidth; x++)
        {
            const sourceX = (((x + 0.5) / scaleX) - 0.5);
            const x0 = Math.floor(sourceX);
            const tx = (sourceX - x0);

            let alpha = 0;
            let red = 0;
            let green = 0;
            let blue = 0;

            for(let j = 0; j < 2; j++)
            {
                const sampleY = (y0 + j);

                if((sampleY < 0) || (sampleY >= height)) continue;

                const weightY = (j ? ty : (1 - ty));

                for(let i = 0; i < 2; i++)
                {
                    const sampleX = (x0 + i);

                    if((sampleX < 0) || (sampleX >= width)) continue;

                    const index = (((sampleY * width) + sampleX) * 4);
                    const sampleAlpha = (pixels[index + 3] * weightY * (i ? tx : (1 - tx)));

                    // getImageData is straight alpha; weighting the colour by alpha averages premultiplied values.
                    alpha += sampleAlpha;
                    red += (pixels[index] * sampleAlpha);
                    green += (pixels[index + 1] * sampleAlpha);
                    blue += (pixels[index + 2] * sampleAlpha);
                }
            }

            if(alpha <= 0) continue;

            const index = (((y * targetWidth) + x) * 4);

            data[index] = Math.round(red / alpha);
            data[index + 1] = Math.round(green / alpha);
            data[index + 2] = Math.round(blue / alpha);
            data[index + 3] = Math.round(alpha);
        }
    }

    return { data, width: targetWidth, height: targetHeight };
};

/**
 * AIR `resampleBitmapData(bitmap, 0.5)`: a round(w/2) x round(h/2) bitmap drawn with smoothing, i.e. bilinear sampling
 * of the premultiplied source at the destination pixel centres. Reads the texture's loaded image source on the CPU
 * (no GPU readback); returns null when the source is not a drawable image.
 */
export const CreateHalfSizeTexture = (texture: Texture): Texture =>
{
    if(!texture || texture.destroyed) return null;

    const resource = texture.source?.resource as CanvasImageSource;

    if(!resource || (typeof document === 'undefined')) return null;

    const frame = texture.frame;
    const width = Math.max(1, Math.round(frame.width));
    const height = Math.max(1, Math.round(frame.height));
    const sourceCanvas = document.createElement('canvas');

    sourceCanvas.width = width;
    sourceCanvas.height = height;

    const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });

    if(!sourceContext) return null;

    let pixels: Uint8ClampedArray = null;

    // A cross-origin image without CORS taints the canvas, so its pixels cannot be read.
    try
    {
        sourceContext.drawImage(resource, frame.x, frame.y, width, height, 0, 0, width, height);
        pixels = sourceContext.getImageData(0, 0, width, height).data;
    }
    catch
    {
        return null;
    }

    const halved = ResampleHalfSize(pixels, width, height);
    const canvas = document.createElement('canvas');

    canvas.width = halved.width;
    canvas.height = halved.height;

    const context = canvas.getContext('2d');

    if(!context) return null;

    const output = context.createImageData(halved.width, halved.height);

    output.data.set(halved.data);

    context.putImageData(output, 0, 0);

    const resampled = Texture.from(canvas, true);

    resampled.source.scaleMode = 'nearest';

    return resampled;
};

interface IHalfSizeEntry
{
    source: Texture;
    texture: Texture;
}

/**
 * Bounded cache of half-size textures keyed by asset name; evicted textures are destroyed. An entry made from another
 * texture than the one asked for (the library was loaded again) is thrown away and made again.
 */
export class HalfSizeTextureCache
{
    private _textures: Map<string, IHalfSizeEntry> = new Map();
    private _pending: Map<string, Texture> = new Map();
    private _failed: WeakMap<Texture, true> = new WeakMap();

    constructor(private readonly _maximumSize: number)
    {}

    /** The cached texture, or null after scheduling its resample outside the render path (ready on a later update). */
    public getTexture(name: string, texture: Texture): Texture
    {
        if(!texture) return null;

        const existing = this._textures.get(name);

        if(existing)
        {
            this._textures.delete(name);

            if((existing.source === texture) && !existing.texture.destroyed)
            {
                this._textures.set(name, existing);

                return existing.texture;
            }

            existing.texture.destroy(true);
        }

        if(this._failed.has(texture) || (this._pending.get(name) === texture)) return null;

        this._pending.set(name, texture);

        setTimeout(() =>
        {
            if(this._pending.get(name) !== texture) return;

            this._pending.delete(name);

            // A texture destroyed in the meantime is asked for again under its new texture.
            if(texture.destroyed) return;

            const resampled = CreateHalfSizeTexture(texture);

            if(resampled) this.add(name, texture, resampled);
            else this._failed.set(texture, true);
        }, 0);

        return null;
    }

    /** True when the texture's pixels could not be read, so no half-size copy will ever come. */
    public hasFailed(texture: Texture): boolean
    {
        return !!texture && this._failed.has(texture);
    }

    public get size(): number
    {
        return this._textures.size;
    }

    private add(name: string, source: Texture, texture: Texture): void
    {
        const previous = this._textures.get(name);

        if(previous) previous.texture.destroy(true);

        this._textures.delete(name);
        this._textures.set(name, { source, texture });

        while(this._textures.size > this._maximumSize)
        {
            const [ oldestName, oldest ] = this._textures.entries().next().value;

            this._textures.delete(oldestName);
            oldest.texture.destroy(true);
        }
    }
}
