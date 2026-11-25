import { ColorConverter } from '@octane/utils';
import { Texture } from 'pixi.js';

/**
 * Additive furniture layers turned into plain colour for still images.
 * Ported from plus-emulator/volt-renderer (by Dennis, GPL-3.0).
 */

const LIGHTNESS_LIMIT = 128;

const textures = new WeakMap<Texture, Texture>();

/**
 * AIR `RoomObjectSpriteVisualization.extractDarknessToAlpha`: a still furniture image has a transparent background, so
 * an additive layer cannot add light to anything. AIR turns the dark part of the layer into transparency and keeps the
 * light colour. The result is made once per texture and lives as long as it. Returns the layer itself when its pixels
 * cannot be read.
 */
export const GetDarknessAlphaTexture = (texture: Texture): Texture =>
{
    if(!texture || texture.destroyed) return texture;

    const existing = textures.get(texture);

    if(existing && !existing.destroyed) return existing;

    const resource = texture.source?.resource as CanvasImageSource;

    if(!resource || (typeof document === 'undefined')) return texture;

    const frame = texture.frame;
    const width = Math.max(1, Math.round(frame.width));
    const height = Math.max(1, Math.round(frame.height));
    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { willReadFrequently: true });

    if(!context) return texture;

    let imageData: ImageData = null;

    // A cross-origin image without CORS taints the canvas, so its pixels cannot be read.
    try
    {
        context.drawImage(resource, frame.x, frame.y, width, height, 0, 0, width, height);

        imageData = context.getImageData(0, 0, width, height);
    }
    catch
    {
        return texture;
    }

    extractDarknessToAlpha(imageData.data);

    context.putImageData(imageData, 0, 0);

    const result = Texture.from(canvas, true);

    textures.set(texture, result);

    // The copy lives as long as the texture it was made from.
    texture.once?.('destroy', () =>
    {
        textures.delete(texture);
        result.destroy(true);
    });

    return result;
};

/** The pixel step on straight-alpha RGBA: dark pixels keep their hue at lightness 128 and lose alpha by how dark they were. */
export const extractDarknessToAlpha = (pixels: Uint8ClampedArray): void =>
{
    for(let index = 0; index < pixels.length; index += 4)
    {
        const hsl = ColorConverter.rgbToHSL((pixels[index] << 16) | (pixels[index + 1] << 8) | pixels[index + 2]);
        const lightness = (hsl & 0xFF);

        if(lightness > LIGHTNESS_LIMIT) continue;

        const rgb = ColorConverter.hslToRGB((hsl & 0xFFFF00) | LIGHTNESS_LIMIT);

        pixels[index] = ((rgb >> 16) & 0xFF);
        pixels[index + 1] = ((rgb >> 8) & 0xFF);
        pixels[index + 2] = (rgb & 0xFF);
        pixels[index + 3] = Math.trunc(pixels[index + 3] * (lightness / LIGHTNESS_LIMIT));
    }
};
