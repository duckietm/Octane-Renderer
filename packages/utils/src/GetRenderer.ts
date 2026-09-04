import { AutoDetectOptions, Renderer, Texture, autoDetectRenderer } from 'pixi.js';
import { GetDesiredScaleMode } from './DprRenderingMode';

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
            else if(!source.nitroFixedScaleMode)
            {
                const scaleMode = GetDesiredScaleMode();

                if(source.style.scaleMode !== scaleMode)
                {
                    source.style.scaleMode = scaleMode;
                    source.style.update();
                }
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

export const PrepareRenderer = async (options: Partial<AutoDetectOptions>): Promise<Renderer> =>
{
    renderer = await autoDetectRenderer(options);

    renderer.events?.destroy();

    patchGlTextureSystem(renderer);
    patchResizeSkip(renderer);

    return renderer;
};

export const GetRenderer = () => renderer;
