import { IGraphicAsset, IRoomObjectSprite, RoomObjectVariable } from '@nitrots/api';
import { GetConfiguration } from '@nitrots/configuration';
import { GetSessionDataManager } from '@nitrots/session';
import { AnimatedSprite, Texture } from 'pixi.js';
import { parseGIF, decompressFrames } from 'gifuct-js';
import { FurnitureAnimatedVisualization } from './FurnitureAnimatedVisualization';

export class FurnitureBadgeDisplayVisualization extends FurnitureAnimatedVisualization
{
    private static readonly BADGE_TAG = 'BADGE';
    private static readonly BADGE_LAYER_ID = 1;

    private _badgeId = '';
    private _badgeAssetNameNormalScale = '';
    private _badgeVisibleInState = -1;
    private _frameTextures: Texture[] = null;
    private _animatedSprite: AnimatedSprite = null;
    private _lastFrameIndex = -1;

    public dispose(): void
    {
        this.disposeAnimatedSprite();
        super.dispose();
    }

    private disposeAnimatedSprite(): void
    {
        if(this._animatedSprite)
        {
            this._animatedSprite.stop();
            this._animatedSprite.destroy();
            this._animatedSprite = null;
        }

        if(this._frameTextures)
        {
            for(const texture of this._frameTextures)
            {
                texture.destroy(true);
            }
            this._frameTextures = null;
        }

        this._lastFrameIndex = -1;
    }

    public getTexture(scale: number, layerId: number, asset: IGraphicAsset): Texture
    {
        return super.getTexture(scale, layerId, asset);
    }

    public update(geometry: any, time: number, update: boolean, skipUpdate: boolean): void
    {
        super.update(geometry, time, update, skipUpdate);

        // Update animated GIF using AnimatedSprite's current frame
        if(this._animatedSprite && this._frameTextures && this._frameTextures.length > 1)
        {
            const currentFrameIndex = this._animatedSprite.currentFrame;

            // Only update if frame has changed
            if(currentFrameIndex !== this._lastFrameIndex)
            {
                this._lastFrameIndex = currentFrameIndex;

                const sessionDataManager = GetSessionDataManager();
                let tex = sessionDataManager.getBadgeImage(this._badgeId);
                if(!tex) tex = sessionDataManager.getGroupBadgeImage(this._badgeId);

                if(!tex) return;

                const currentFrameTexture = this._frameTextures[currentFrameIndex];
                if(!currentFrameTexture) return;

                // Update the badge canvas with the current frame
                const badgeCanvas = this.getBadgeCanvas(tex);
                if(!badgeCanvas) return;

                const ctx = badgeCanvas.getContext('2d', { willReadFrequently: true });

                // Create a temporary canvas to extract the frame texture data
                const frameCanvas = document.createElement('canvas');
                frameCanvas.width = currentFrameTexture.width;
                frameCanvas.height = currentFrameTexture.height;
                const frameCtx = frameCanvas.getContext('2d');

                // Get the source from the texture
                const frameSource = (currentFrameTexture.source as any).resource;
                if(frameSource instanceof HTMLCanvasElement || frameSource instanceof HTMLImageElement)
                {
                    ctx.clearRect(0, 0, badgeCanvas.width, badgeCanvas.height);
                    ctx.drawImage(frameSource, 0, 0);
                    tex.source.update();

                    const assetName = this._badgeAssetNameNormalScale;
                    if(this.asset && assetName)
                    {
                        const asset = this.getAsset(assetName, FurnitureBadgeDisplayVisualization.BADGE_LAYER_ID);
                        if(asset && asset.texture)
                        {
                            asset.texture.source.update();
                        }
                    }
                }
            }
        }
    }

    protected updateModel(scale: number): boolean
    {
        let needsUpdate = super.updateModel(scale);

        const badgeStatus = this.object.model.getValue<number>(RoomObjectVariable.FURNITURE_BADGE_IMAGE_STATUS);
        const badgeId = this.object.model.getValue<string>(RoomObjectVariable.FURNITURE_BADGE_ASSET_NAME);

        if(badgeStatus === -1)
        {
            this._badgeId = '';
            this._badgeAssetNameNormalScale = '';
            this._badgeVisibleInState = -1;
            this.disposeAnimatedSprite();

            return needsUpdate;
        }

        if((badgeStatus === 1) && badgeId && (badgeId !== this._badgeId))
        {
            this._badgeId = badgeId;
            this._badgeAssetNameNormalScale = badgeId;

            const visibleInState = this.object.model.getValue<number>(RoomObjectVariable.FURNITURE_BADGE_VISIBLE_IN_STATE);
            this._badgeVisibleInState = isNaN(visibleInState) ? -1 : visibleInState;

            this.disposeAnimatedSprite();
            this.addBadgeToAssetCollection(badgeId);

            const layerId = FurnitureBadgeDisplayVisualization.BADGE_LAYER_ID;
            this._assetNames[layerId] = undefined;
            this._updatedLayers[layerId] = undefined;
            this._spriteTags[layerId] = undefined;

            this.updateObjectCounter = -1;
            needsUpdate = true;
        }

        return needsUpdate;
    }

    protected getSpriteAssetName(scale: number, layerId: number): string
    {
        const tag = this.getLayerTag(scale, this.direction, layerId);

        if(tag !== FurnitureBadgeDisplayVisualization.BADGE_TAG)
        {
            return super.getSpriteAssetName(scale, layerId);
        }

        if((this._badgeVisibleInState !== -1) && (this.object.getState(0) !== this._badgeVisibleInState))
        {
            return super.getSpriteAssetName(scale, layerId);
        }

        const assetName = this._badgeAssetNameNormalScale;
        if(!assetName) return super.getSpriteAssetName(scale, layerId);

        const a = this.getAsset(assetName, layerId);
        if(!a || !a.texture) return super.getSpriteAssetName(scale, layerId);

        return assetName;
    }

    protected updateSprite(scale: number, layerId: number): void
    {
        super.updateSprite(scale, layerId);

        const tag = this.getLayerTag(scale, this.direction, layerId);

        if(tag === FurnitureBadgeDisplayVisualization.BADGE_TAG)
        {
            const sprite = this.getSprite(layerId);

            if(!sprite) return;

            sprite.visible = true;
            sprite.alpha = 255;
            sprite.color = 0xFFFFFF;

            if(scale === 32) sprite.scale = ((sprite.scale || 1) * 0.5);
        }
    }

    protected getLayerXOffset(scale: number, direction: number, layerId: number): number
    {
        let offset = super.getLayerXOffset(scale, direction, layerId);

        if(this.getLayerTag(scale, direction, layerId) === FurnitureBadgeDisplayVisualization.BADGE_TAG)
        {
            const a = this.getAsset(this._badgeAssetNameNormalScale, layerId);
            if(!a) return offset;

            const renderedW = (scale === 32) ? (a.width * 0.5) : a.width;
            const targetW = (scale === 64) ? 40 : 20;
            offset += ((targetW - renderedW) / 2);
        }

        return offset;
    }

    protected getLayerYOffset(scale: number, direction: number, layerId: number): number
    {
        let offset = super.getLayerYOffset(scale, direction, layerId);

        if(this.getLayerTag(scale, direction, layerId) === FurnitureBadgeDisplayVisualization.BADGE_TAG)
        {
            const a = this.getAsset(this._badgeAssetNameNormalScale, layerId);
            if(!a) return offset;

            const renderedH = (scale === 32) ? (a.height * 0.5) : a.height;
            const targetH = (scale === 64) ? 40 : 20;
            offset += ((targetH - renderedH) / 2);
        }

        return offset;
    }

    // Normalizes a badge texture's backing resource to a mutable 2D canvas.
    //
    // The asset pipeline decodes badge images via `createImageBitmap` (see
    // StaticImageDecoder), so `tex.source.resource` is an ImageBitmap (or, on the
    // fallback path, an HTMLImageElement) — neither of which has `getContext`. This
    // furni needs a canvas it can draw GIF frames into, so bake the immutable bitmap
    // into a canvas once and swap it in as the source's resource. Returns null for
    // sources that have no readable CPU resource (e.g. GPU-only rendered group badges).
    private getBadgeCanvas(tex: Texture): HTMLCanvasElement
    {
        const source = tex.source as any;
        const resource = source?.resource;

        if(resource instanceof HTMLCanvasElement) return resource;

        const isBitmap = (typeof ImageBitmap !== 'undefined') && (resource instanceof ImageBitmap);

        if(isBitmap || (resource instanceof HTMLImageElement))
        {
            const width = resource.width || (resource as HTMLImageElement).naturalWidth || source.pixelWidth || 0;
            const height = resource.height || (resource as HTMLImageElement).naturalHeight || source.pixelHeight || 0;

            if(!width || !height) return null;

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if(!ctx) return null;

            ctx.drawImage(resource, 0, 0);

            // Point the texture at the mutable canvas so later getContext()/drawImage()
            // and source.update() calls operate on real, readable canvas pixels.
            source.resource = canvas;

            return canvas;
        }

        return null;
    }

    private async addBadgeToAssetCollection(badgeId: string): Promise<void>
    {
        const sessionDataManager = GetSessionDataManager();

        let tex = sessionDataManager.getBadgeImage(badgeId);
        if(!tex) tex = sessionDataManager.getGroupBadgeImage(badgeId);

        if(!tex || !this.asset) return;

        const badgeCanvas = this.getBadgeCanvas(tex);

        // Group/rendered badges are GPU-only (no readable canvas resource) and static, so
        // they can't be driven through the animated-GIF canvas path — add them as-is.
        if(!badgeCanvas)
        {
            this.asset.addAsset(badgeId, tex, true, 0, 0, false, false);

            return;
        }

        const ctx = badgeCanvas.getContext('2d', { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, 1, 1);
        const isEmpty = imageData.data[3] === 0;

        if(isEmpty || !this._frameTextures)
        {
            const badgeUrl = GetConfiguration().getValue<string>('badge.asset.url', '').replace('%badgename%', badgeId);

            try
            {
                const response = await fetch(badgeUrl);
                const arrayBuffer = await response.arrayBuffer();
                const gif = parseGIF(arrayBuffer);
                const frames = decompressFrames(gif, true);

                if(frames && frames.length > 0)
                {
                    this._frameTextures = [];
                    const frameDelays: number[] = [];

                    const accCanvas = document.createElement('canvas');
                    accCanvas.width = gif.lsd.width;
                    accCanvas.height = gif.lsd.height;
                    const accCtx = accCanvas.getContext('2d', { willReadFrequently: true });

                    for(let i = 0; i < frames.length; i++)
                    {
                        const frame = frames[i];

                        if(i > 0)
                        {
                            const prevDisposal = frames[i - 1].disposalType;
                            if(prevDisposal === 2)
                            {
                                accCtx.clearRect(0, 0, gif.lsd.width, gif.lsd.height);
                            }
                        }

                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = frame.dims.width;
                        tempCanvas.height = frame.dims.height;
                        const tempCtx = tempCanvas.getContext('2d');

                        const patchData = new ImageData(
                            new Uint8ClampedArray(frame.patch),
                            frame.dims.width,
                            frame.dims.height
                        );
                        tempCtx.putImageData(patchData, 0, 0);

                        accCtx.drawImage(tempCanvas, frame.dims.left, frame.dims.top);
                        tempCanvas.width = 0;
                        tempCanvas.height = 0;

                        // Create a new canvas for this frame and create a texture from it
                        const frameCanvas = document.createElement('canvas');
                        frameCanvas.width = gif.lsd.width;
                        frameCanvas.height = gif.lsd.height;
                        const frameCtx = frameCanvas.getContext('2d');
                        frameCtx.drawImage(accCanvas, 0, 0);

                        // Create texture from canvas
                        const frameTexture = Texture.from(frameCanvas);
                        this._frameTextures.push(frameTexture);

                        // GIF delays are in centiseconds (1/100th of a second)
                        frameDelays.push(frame.delay || 10);
                    }

                    accCanvas.width = 0;
                    accCanvas.height = 0;

                    // Create AnimatedSprite with frame textures
                    if(this._frameTextures.length > 1)
                    {
                        this._animatedSprite = new AnimatedSprite(this._frameTextures);

                        // Calculate average delay and set animation speed
                        const avgDelay = frameDelays.reduce((a, b) => a + b, 0) / frameDelays.length;
                        // Convert centiseconds to seconds, then to animation speed
                        // AnimatedSprite.animationSpeed is frames per ticker update (60fps default)
                        // delay in centiseconds * 10 = milliseconds, / 1000 = seconds
                        // At 60fps, 1 frame = ~16.67ms
                        const delayMs = (avgDelay > 50 ? 10 : avgDelay) * 10;
                        const framesPerTick = 16.67 / delayMs;
                        this._animatedSprite.animationSpeed = framesPerTick;

                        this._animatedSprite.loop = true;
                        this._animatedSprite.play();
                        this._lastFrameIndex = -1;
                    }

                    // Draw first frame to the badge canvas
                    const firstFrameSource = (this._frameTextures[0].source as any).resource;
                    if(firstFrameSource instanceof HTMLCanvasElement)
                    {
                        ctx.clearRect(0, 0, badgeCanvas.width, badgeCanvas.height);
                        ctx.drawImage(firstFrameSource, 0, 0);
                        tex.source.update();
                    }
                }
            }
            catch (err)
            {
                console.error('Failed to parse GIF, using static image:', err);

                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () =>
                {
                    ctx.clearRect(0, 0, badgeCanvas.width, badgeCanvas.height);
                    ctx.drawImage(img, 0, 0, badgeCanvas.width, badgeCanvas.height);
                    tex.source.update();
                    img.onload = null;
                    img.onerror = null;
                };
                img.onerror = () =>
                {
                    img.onload = null;
                    img.onerror = null;
                };
                img.src = badgeUrl;
            }
        }

        this.asset.addAsset(badgeId, tex, true, 0, 0, false, false);
    }
}
