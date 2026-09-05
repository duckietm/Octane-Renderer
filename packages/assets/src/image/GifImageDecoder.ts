import { AnimatedGIF } from '@pixi/gif';
import { Texture } from 'pixi.js';
import { LoadedImageResource } from './ImageResource';

export interface GifController
{
    texture: Texture;
    destroy(): void;
}

export type GifControllerFactory = (buffer: ArrayBuffer) => GifController;

export const decodeGifImage = (
    bytes: Uint8Array,
    factory: GifControllerFactory = buffer => AnimatedGIF.fromBuffer(buffer)
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
