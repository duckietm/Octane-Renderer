import { decompressFrames, ParsedFrame, ParsedGif, parseGIF } from 'gifuct-js';
import { Texture } from 'pixi.js';
import { createCanvasAnimatedResource } from './CanvasAnimatedTexture';
import { DecodedAnimation } from './DecodedAnimation';
import { assertSafeImage } from './ImageLimits';
import { LoadedImageResource } from './ImageResource';

export interface GifController
{
    texture: Texture;
    destroy(): void;
}

export type GifControllerFactory = (buffer: ArrayBuffer) => GifController;

// GIF disposal methods (Graphic Control Extension): what happens to a frame's area before the next frame is drawn.
const DISPOSAL_RESTORE_BACKGROUND = 2;
const DISPOSAL_RESTORE_PREVIOUS = 3;

// A file without any Graphic Control Extension: the frame is cleared and shown at 30 fps, as the previous decoder did.
const DEFAULT_DISPOSAL = DISPOSAL_RESTORE_BACKGROUND;
const DEFAULT_DELAY_MS = 1000 / 30;

const hasImage = (frame: ParsedGif['frames'][number]): frame is Extract<ParsedGif['frames'][number], { image: unknown }> => ('image' in frame) && !!frame.image;

/**
 * Decodes a GIF into fully composed RGBA frames.
 *
 * Each frame's patch is drawn over what the previous frames left on the logical screen: transparent patch pixels
 * keep what is underneath. After the frame is captured its disposal method applies: 2 clears the frame's own area
 * to transparent, 3 puts back the screen as it was before the frame was drawn, anything else leaves it.
 */
export const decodeGifAnimation = (buffer: ArrayBuffer): DecodedAnimation =>
{
    if(!buffer || !buffer.byteLength) throw new Error('The GIF is empty');

    const gif = parseGIF(buffer);
    const width = gif?.lsd?.width;
    const height = gif?.lsd?.height;
    let lastControl: { gce: unknown } = null;

    // A frame without its own Graphic Control Extension keeps the last one seen (delay, disposal, transparency).
    for(const frame of gif.frames)
    {
        if('gce' in frame && frame.gce) lastControl = frame;
        else if(hasImage(frame) && lastControl) (frame as { gce: unknown }).gce = lastControl.gce;
    }

    assertSafeImage({ width, height, frameCount: Math.max(1, gif.frames.filter(hasImage).length) });

    const parsedFrames: ParsedFrame[] = decompressFrames(gif, true);

    if(!parsedFrames.length) throw new Error('The GIF contains no image frames');

    const screen = new Uint8ClampedArray(width * height * 4);
    const frames: DecodedAnimation['frames'] = [];

    for(const frame of parsedFrames)
    {
        const disposal = frame.disposalType ?? DEFAULT_DISPOSAL;
        const previous = (disposal === DISPOSAL_RESTORE_PREVIOUS) ? screen.slice() : null;

        drawPatch(screen, width, height, frame);

        frames.push({ pixels: screen.slice(), durationMs: frame.delay ?? DEFAULT_DELAY_MS });

        if(disposal === DISPOSAL_RESTORE_BACKGROUND) clearArea(screen, width, height, frame.dims);
        else if(previous) screen.set(previous);
    }

    // The previous decoder looped every GIF forever, whatever its loop extension says; callers rely on that.
    return { width, height, loopCount: 0, frames };
};

const clipArea = (width: number, height: number, dims: ParsedFrame['dims']) => ({
    left: Math.max(0, dims.left),
    top: Math.max(0, dims.top),
    right: Math.min(width, dims.left + dims.width),
    bottom: Math.min(height, dims.top + dims.height)
});

const drawPatch = (screen: Uint8ClampedArray, width: number, height: number, frame: ParsedFrame): void =>
{
    const { dims, patch } = frame;
    const area = clipArea(width, height, dims);

    for(let y = area.top; y < area.bottom; y++)
    {
        for(let x = area.left; x < area.right; x++)
        {
            const source = (((y - dims.top) * dims.width) + (x - dims.left)) * 4;

            // Patch pixels are either opaque or the transparent index; a transparent one shows what is underneath.
            if(!patch[source + 3]) continue;

            const target = ((y * width) + x) * 4;

            screen[target] = patch[source];
            screen[target + 1] = patch[source + 1];
            screen[target + 2] = patch[source + 2];
            screen[target + 3] = 255;
        }
    }
};

const clearArea = (screen: Uint8ClampedArray, width: number, height: number, dims: ParsedFrame['dims']): void =>
{
    const area = clipArea(width, height, dims);

    if((area.right <= area.left) || (area.bottom <= area.top)) return;

    for(let y = area.top; y < area.bottom; y++) screen.fill(0, ((y * width) + area.left) * 4, ((y * width) + area.right) * 4);
};

const createGifController: GifControllerFactory = buffer =>
{
    const resource = createCanvasAnimatedResource(decodeGifAnimation(buffer), 'gif');

    return { texture: resource.texture, destroy: () => resource.dispose() };
};

export const decodeGifImage = (
    bytes: Uint8Array,
    factory: GifControllerFactory = createGifController
): LoadedImageResource =>
{
    const controller = factory(Uint8Array.from(bytes).buffer);
    const texture = controller?.texture;

    if(!texture) throw new Error('The GIF decoder returned no texture');
    if(texture.source) texture.source.scaleMode = 'linear';
    if(texture.source) (texture.source as any).octaneFixedScaleMode = true;

    let disposed = false;

    return {
        texture,
        format: 'gif',
        animated: true,
        dispose: () =>
        {
            if(disposed) return;

            disposed = true;
            controller.destroy();
        }
    };
};
