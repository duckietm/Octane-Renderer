import { Texture, Ticker } from 'pixi.js';
import { DecodedAnimation } from './DecodedAnimation';
import { ImageFormat } from './ImageFormat';
import { assertSafeImage, IMAGE_LIMITS } from './ImageLimits';
import { LoadedImageResource } from './ImageResource';

export interface AnimationTick
{
    deltaMS: number;
}

export interface AnimationTicker
{
    add(callback: (tick: AnimationTick) => void): void;
    remove(callback: (tick: AnimationTick) => void): void;
}

export interface AnimationSurface
{
    source: HTMLCanvasElement;
    render(pixels: Uint8ClampedArray): void;
}

export interface CanvasAnimatedTextureDependencies
{
    ticker: AnimationTicker;
    createSurface(width: number, height: number): AnimationSurface;
    textureFrom(source: HTMLCanvasElement): Texture;
}

export const createCanvasAnimatedResource = (
    animation: DecodedAnimation,
    format: ImageFormat,
    dependencies: CanvasAnimatedTextureDependencies = DEFAULT_DEPENDENCIES
): LoadedImageResource =>
{
    validateAnimation(animation);

    const normalizedDurations = animation.frames.map(frame =>
        Number.isFinite(frame.durationMs) ? Math.max(IMAGE_LIMITS.minFrameDurationMs, frame.durationMs) : IMAGE_LIMITS.minFrameDurationMs);
    const surface = dependencies.createSurface(animation.width, animation.height);
    const texture = dependencies.textureFrom(surface.source);

    if(!texture) throw new Error('Animated image did not create a Pixi texture');
    if(texture.source) texture.source.scaleMode = 'linear';
    if(texture.source) (texture.source as any).octaneFixedScaleMode = true;

    let frameIndex = 0;
    let completedLoops = 0;
    let elapsedMs = 0;
    let registered = true;
    let disposed = false;

    surface.render(animation.frames[0].pixels);

    const unregister = (): void =>
    {
        if(!registered) return;

        dependencies.ticker.remove(update);
        registered = false;
    };

    const update = (tick: AnimationTick): void =>
    {
        if(!registered || disposed) return;

        elapsedMs += Math.max(0, Number.isFinite(tick?.deltaMS) ? tick.deltaMS : 0);

        while(elapsedMs >= normalizedDurations[frameIndex])
        {
            elapsedMs -= normalizedDurations[frameIndex];

            if(frameIndex === animation.frames.length - 1)
            {
                completedLoops++;

                if(animation.loopCount > 0 && completedLoops >= animation.loopCount)
                {
                    unregister();
                    return;
                }

                frameIndex = 0;
            }
            else
            {
                frameIndex++;
            }

            surface.render(animation.frames[frameIndex].pixels);
            texture.source?.update();
        }
    };

    dependencies.ticker.add(update);

    return {
        texture,
        format,
        animated: true,
        dispose: () =>
        {
            if(disposed) return;

            disposed = true;
            unregister();
            texture.destroy(true);
        }
    };
};

const validateAnimation = (animation: DecodedAnimation): void =>
{
    if(!animation?.frames?.length) throw new Error('Animated image contains no frames');
    if(!Number.isInteger(animation.loopCount) || animation.loopCount < 0)
        throw new Error(`Animation loop count must be a non-negative integer (received ${ animation.loopCount })`);

    assertSafeImage({ width: animation.width, height: animation.height, frameCount: animation.frames.length });

    const expectedBytes = animation.width * animation.height * 4;

    for(const [ index, frame ] of animation.frames.entries())
    {
        if(frame.pixels?.byteLength !== expectedBytes)
            throw new Error(`Animation frame ${ index } RGBA byte length is invalid (expected ${ expectedBytes }, received ${ frame.pixels?.byteLength ?? 0 })`);
    }
};

const createSurface = (width: number, height: number): AnimationSurface =>
{
    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if(!context) throw new Error('Could not create a 2D canvas context for animated image playback');

    return {
        source: canvas,
        render: pixels =>
        {
            const copy = new Uint8ClampedArray(pixels.byteLength);

            copy.set(pixels);
            context.putImageData(new ImageData(copy, width, height), 0, 0);
        }
    };
};

const DEFAULT_DEPENDENCIES: CanvasAnimatedTextureDependencies = {
    ticker: Ticker.shared,
    createSurface,
    textureFrom: source => Texture.from(source)
};
