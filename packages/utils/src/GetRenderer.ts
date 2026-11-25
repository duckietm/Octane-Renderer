import { AutoDetectOptions, Renderer, Texture, WebGLRenderer, autoDetectRenderer } from 'pixi.js';

let renderer: Renderer = null;

const patchGlTextureSystem = (r: Renderer): void =>
{
    const textureSystem = (r as any).texture;

    if(!textureSystem) return;

    const proto = Object.getPrototypeOf(textureSystem);

    if(!proto) return;

    const origUpdateStyle = proto.updateStyle;

    if(origUpdateStyle && !proto.__patchedUpdateStyle)
    {
        proto.updateStyle = function(source: any, firstCreation: boolean)
        {
            if(!source || source.destroyed || !source.style) return;

            return origUpdateStyle.call(this, source, firstCreation);
        };

        proto.__patchedUpdateStyle = true;
    }

    const origBindSource = proto.bindSource;

    if(origBindSource && !proto.__patchedBindSource)
    {
        proto.bindSource = function(source: any, location = 0)
        {
            if(!source || source.destroyed || !source.style)
            {
                source = Texture.EMPTY.source;
            }

            return origBindSource.call(this, source, location);
        };

        proto.__patchedBindSource = true;
    }
};

const patchResizeSkip = (r: Renderer): void =>
{
    const origResize = r.resize.bind(r);

    r.resize = ((width: number, height: number, resolution?: number): void =>
    {
        origResize(width, height, resolution);

        const view = (r as any).view;
        const source = view?.texture?.source;

        if(!source) return;

        source.resizeCanvas?.();
        source.emit('resize', source);

        if(view.screen)
        {
            view.screen.width = source.width;
            view.screen.height = source.height;
        }
    });
};

/**
 * A WebGL renderer made directly, as autoDetectRenderer would make it for a webgl preference, but without
 * its support check, which creates a throwaway WebGL context first. Null when WebGL cannot start here.
 */
const createWebGLRenderer = async (options: Partial<AutoDetectOptions>): Promise<Renderer> =>
{
    const glRenderer = new WebGLRenderer();

    try
    {
        const glOptions: Partial<AutoDetectOptions> = { ...options, ...options.webgl };

        delete glOptions.webgl;
        delete glOptions.webgpu;
        delete glOptions.canvasOptions;

        await glRenderer.init(glOptions);

        return glRenderer;
    }
    catch
    {
        try
        {
            glRenderer.destroy();
        }
        catch
        {
            // Half made: nothing more to release.
        }

        return null;
    }
};

export const PrepareRenderer = async (options: Partial<AutoDetectOptions>): Promise<Renderer> =>
{
    // Any other preference, or a WebGL that fails to start, goes through Pixi's own detection and fallbacks.
    const direct = ((options.preference === 'webgl') && (typeof document !== 'undefined')) ? await createWebGLRenderer(options) : null;

    renderer = direct ?? await autoDetectRenderer(options);

    renderer.events?.destroy();

    patchGlTextureSystem(renderer);
    patchResizeSkip(renderer);

    return renderer;
};

export const GetRenderer = () => renderer;
