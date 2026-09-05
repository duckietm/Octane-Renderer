import { GetRoomEngine } from '@octane/room';
import { GetDesiredScaleMode, GetRenderer, StartDprRenderingModeWatcher } from '@octane/utils';
import { BrowserAdapter, DOMAdapter, HelloSystem, TextureSource } from 'pixi.js';

HelloSystem.defaultOptions.hello = true;
StartDprRenderingModeWatcher();
DOMAdapter.set(BrowserAdapter);

if(typeof window !== 'undefined')
{
    (window as any).__octaneRenderDebug = (): string =>
    {
        const out: any = {
            dpr: window.devicePixelRatio,
            desiredScaleMode: GetDesiredScaleMode(),
            defaultScaleMode: TextureSource.defaultOptions.scaleMode
        };

        try
        {
            const renderer: any = GetRenderer();
            const canvas = renderer?.canvas;

            out.renderer = renderer ? {
                res: renderer.resolution,
                screen: [ renderer.screen.width, renderer.screen.height ],
                attr: canvas ? [ canvas.width, canvas.height ] : null,
                css: canvas ? [ canvas.style.width, canvas.style.height ] : null
            } : null;

            const census: Record<string, number> = {};

            for(const source of (renderer?.texture?.managedTextures ?? []))
            {
                const key = `${ source?.style?.scaleMode ?? '?' }${ (source as any)?.octaneFixedScaleMode ? '/fixed' : '' }`;

                census[key] = (census[key] ?? 0) + 1;
            }

            out.textures = census;

            const engine: any = GetRoomEngine();
            const roomId = engine?._activeRoomId ?? -1;
            const roomCanvas = engine?.getRoomInstanceRenderingCanvas?.(roomId, 1);
            const geometry = engine?.getRoomInstanceGeometry?.(roomId, 1);

            out.room = roomCanvas ? {
                size: [ roomCanvas.width, roomCanvas.height ],
                scale: roomCanvas.scale,
                offset: [ roomCanvas.screenOffsetX, roomCanvas.screenOffsetY ],
                geometryScale: geometry?.scale ?? null
            } : null;
        }
        catch(e)
        {
            out.error = String(e);
        }

        return JSON.stringify(out);
    };
}

export * from '@octane/api';
export * from '@octane/assets';
export * from '@octane/avatar';
export * from '@octane/camera';
export * from '@octane/communication';
export * from '@octane/configuration';
export * from '@octane/events';
export * from '@octane/localization';
export * from '@octane/room';
export * from '@octane/session';
export * from '@octane/sound';
export * from '@octane/utils';
export * from './DevTools';
export * from './pixi-proxy';
