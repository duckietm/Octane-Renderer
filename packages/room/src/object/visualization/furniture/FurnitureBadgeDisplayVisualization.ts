import { IGraphicAsset, IRoomObjectSprite, RoomObjectVariable } from '@octane/api';
import { GetConfiguration } from '@octane/configuration';
import { GetSessionDataManager } from '@octane/session';
import { Texture } from 'pixi.js';
import { decompressFrames, parseGIF } from 'gifuct-js';
import { FurnitureAnimatedVisualization } from './FurnitureAnimatedVisualization';

/** A badge image decoded once: one canvas per frame (a still image has one) and each frame's delay. */
export interface DecodedBadgeImage
{
    frames: HTMLCanvasElement[];
    delays: number[];
}

export class FurnitureBadgeDisplayVisualization extends FurnitureAnimatedVisualization
{
    private static readonly BADGE_TAG = 'BADGE';
    private static readonly BADGE_LAYER_ID = 1;
    private static readonly MIN_FRAME_DELAY_MS = 20;
    private static readonly MAX_DECODED_BADGES = 64;

    // Decoded once per badge for every display: each display used to fetch (and, for a PNG, load
    // twice) the same badge again.
    private static readonly DECODED_BADGES: Map<string, Promise<DecodedBadgeImage>> = new Map();
    private static _nextInstance = 0;

    private readonly _instance = ++FurnitureBadgeDisplayVisualization._nextInstance;

    private _badgeId = '';
    private _badgeAssetNameNormalScale = '';
    private _badgeVisibleInState = -1;
    private _ownsBadgeAsset = false;
    private _badgeCanvas: HTMLCanvasElement = null;
    private _badgeTexture: Texture = null;
    private _decoded: DecodedBadgeImage = null;
    private _animationStart = -1;
    private _lastFrameIndex = -1;
    private _request = 0;
    private _disposed = false;

    public dispose(): void
    {
        this._disposed = true;
        this.releaseBadge();
        super.dispose();
    }

    /**
     * Drops this display's badge. A badge copy it owns goes with it: disposing the asset destroys the
     * private texture. A pending decode is abandoned through the request token.
     */
    private releaseBadge(): void
    {
        this._request++;

        if(this._ownsBadgeAsset && this._badgeAssetNameNormalScale)
        {
            if(this.asset) this.asset.disposeAsset(this._badgeAssetNameNormalScale);
            else this._badgeTexture?.destroy(true);
        }

        this._ownsBadgeAsset = false;
        this._badgeCanvas = null;
        this._badgeTexture = null;
        this._decoded = null;
        this._animationStart = -1;
        this._lastFrameIndex = -1;
    }

    public getTexture(scale: number, layerId: number, asset: IGraphicAsset): Texture
    {
        return super.getTexture(scale, layerId, asset);
    }

    public update(geometry: any, time: number, update: boolean, skipUpdate: boolean): void
    {
        super.update(geometry, time, update, skipUpdate);

        const decoded = this._decoded;

        if(!decoded || (decoded.frames.length < 2) || !this._badgeCanvas) return;

        // The frame follows the room's own clock: an AnimatedSprite only kept time, and stayed
        // registered on the Ticker after the room was left.
        if(this._animationStart < 0) this._animationStart = time;

        const index = FurnitureBadgeDisplayVisualization.frameAt(decoded.delays, time - this._animationStart);

        if(index === this._lastFrameIndex) return;

        this._lastFrameIndex = index;
        this.drawFrame(decoded.frames[index]);
    }

    /** The frame showing at {@code elapsed} milliseconds into a looping animation. */
    public static frameAt(delays: number[], elapsed: number): number
    {
        const total = delays.reduce((sum, delay) => sum + delay, 0);

        if(!total) return 0;

        let position = ((elapsed % total) + total) % total;

        for(let index = 0; index < delays.length; index++)
        {
            if(position < delays[index]) return index;

            position -= delays[index];
        }

        return delays.length - 1;
    }

    private drawFrame(frame: HTMLCanvasElement): void
    {
        const ctx = this._badgeCanvas?.getContext('2d');

        if(!ctx || !frame) return;

        ctx.clearRect(0, 0, this._badgeCanvas.width, this._badgeCanvas.height);
        ctx.drawImage(frame, 0, 0, this._badgeCanvas.width, this._badgeCanvas.height);
        this._badgeTexture?.source.update();
    }

    protected updateModel(scale: number): boolean
    {
        let needsUpdate = super.updateModel(scale);

        const badgeStatus = this.object.model.getValue<number>(RoomObjectVariable.FURNITURE_BADGE_IMAGE_STATUS);
        const badgeId = this.object.model.getValue<string>(RoomObjectVariable.FURNITURE_BADGE_ASSET_NAME);

        if(badgeStatus === -1)
        {
            this.releaseBadge();
            this._badgeId = '';
            this._badgeAssetNameNormalScale = '';
            this._badgeVisibleInState = -1;

            return needsUpdate;
        }

        if((badgeStatus === 1) && badgeId && (badgeId !== this._badgeId))
        {
            this.releaseBadge();
            this._badgeId = badgeId;
            this._badgeAssetNameNormalScale = badgeId;

            const visibleInState = this.object.model.getValue<number>(RoomObjectVariable.FURNITURE_BADGE_VISIBLE_IN_STATE);
            this._badgeVisibleInState = isNaN(visibleInState) ? -1 : visibleInState;

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

    // AIR: the badge layer is sent to the camera renderer as the badge image in the image library.
    protected getLibraryAssetNameForSprite(asset: IGraphicAsset, sprite: IRoomObjectSprite): string
    {
        if((sprite.tag === FurnitureBadgeDisplayVisualization.BADGE_TAG) && this._badgeAssetNameNormalScale && (sprite.name === this._badgeAssetNameNormalScale))
        {
            return '%image.library.url%album1584/' + this._badgeId.replace('badge_', '') + '.png';
        }

        return super.getLibraryAssetNameForSprite(asset, sprite);
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

    /**
     * A private canvas copy of the badge. The badge texture belongs to the session's image cache and
     * other views use it: drawing animation frames into it (or swapping its resource) changed those
     * views and made displays of the same badge flicker. Null when the image has no CPU-readable
     * resource (a GPU-rendered group badge).
     */
    private static copyToCanvas(tex: Texture): HTMLCanvasElement
    {
        const source = tex.source as any;
        const resource = source?.resource;
        const readable = (resource instanceof HTMLCanvasElement)
            || (resource instanceof HTMLImageElement)
            || ((typeof ImageBitmap !== 'undefined') && (resource instanceof ImageBitmap));

        if(!readable) return null;

        const width = resource.width || (resource as HTMLImageElement).naturalWidth || source.pixelWidth || 0;
        const height = resource.height || (resource as HTMLImageElement).naturalHeight || source.pixelHeight || 0;

        if(!width || !height) return null;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if(!ctx) return null;

        ctx.drawImage(resource, 0, 0);

        return canvas;
    }

    private async addBadgeToAssetCollection(badgeId: string): Promise<void>
    {
        const sessionDataManager = GetSessionDataManager();

        let tex = sessionDataManager.getBadgeImage(badgeId);
        if(!tex) tex = sessionDataManager.getGroupBadgeImage(badgeId);

        if(!tex || !this.asset) return;

        const canvas = FurnitureBadgeDisplayVisualization.copyToCanvas(tex);

        // A GPU-rendered group badge is static: it is shown as it is, under the badge's own name, and
        // stays the cache's - this display never disposes it.
        if(!canvas)
        {
            this.asset.addAsset(badgeId, tex, true, 0, 0, false, false);

            return;
        }

        this._badgeAssetNameNormalScale = badgeId + '_display_' + this._instance;
        this._badgeCanvas = canvas;
        this._badgeTexture = Texture.from(canvas, true);
        this._ownsBadgeAsset = true;
        this.asset.addAsset(this._badgeAssetNameNormalScale, this._badgeTexture, true, 0, 0, false, false);

        const request = this._request;
        const decoded = await FurnitureBadgeDisplayVisualization.decodeBadge(badgeId);

        // Left, disposed or showing another badge by now: nothing of this decode is used.
        if(this._disposed || (request !== this._request) || !decoded || !decoded.frames.length) return;

        this._decoded = decoded;
        this._animationStart = -1;
        this._lastFrameIndex = 0;
        this.drawFrame(decoded.frames[0]);
    }

    /** The decoded badge image, fetched and decoded once for every display of that badge. */
    public static decodeBadge(badgeId: string): Promise<DecodedBadgeImage>
    {
        const cache = FurnitureBadgeDisplayVisualization.DECODED_BADGES;
        let decoded = cache.get(badgeId);

        if(!decoded)
        {
            decoded = FurnitureBadgeDisplayVisualization.fetchAndDecode(badgeId).catch((): DecodedBadgeImage => null);
            cache.set(badgeId, decoded);

            if(cache.size > FurnitureBadgeDisplayVisualization.MAX_DECODED_BADGES) cache.delete(cache.keys().next().value);
        }

        return decoded;
    }

    private static async fetchAndDecode(badgeId: string): Promise<DecodedBadgeImage>
    {
        const badgeUrl = GetConfiguration().getValue<string>('badge.asset.url', '').replace('%badgename%', badgeId);
        const response = await fetch(badgeUrl);

        if(!response.ok) return null;

        const bytes = await response.arrayBuffer();

        try
        {
            return FurnitureBadgeDisplayVisualization.decodeGif(bytes);
        }
        catch
        {
            // Not a GIF: the same bytes as a still image, without loading the badge a second time.
            const bitmap = await createImageBitmap(new Blob([ bytes ]));
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
            bitmap.close?.();

            return { frames: [ canvas ], delays: [ 0 ] };
        }
    }

    private static decodeGif(bytes: ArrayBuffer): DecodedBadgeImage
    {
        const gif = parseGIF(bytes);
        const frames = decompressFrames(gif, true);

        if(!frames || !frames.length) return null;

        const width = gif.lsd.width;
        const height = gif.lsd.height;
        const accumulator = document.createElement('canvas');
        accumulator.width = width;
        accumulator.height = height;
        const accCtx = accumulator.getContext('2d', { willReadFrequently: true });
        const patch = document.createElement('canvas');
        const patchCtx = patch.getContext('2d');
        const decoded: DecodedBadgeImage = { frames: [], delays: [] };

        for(let i = 0; i < frames.length; i++)
        {
            const frame = frames[i];

            if((i > 0) && (frames[i - 1].disposalType === 2)) accCtx.clearRect(0, 0, width, height);

            patch.width = frame.dims.width;
            patch.height = frame.dims.height;
            patchCtx.putImageData(new ImageData(new Uint8ClampedArray(frame.patch), frame.dims.width, frame.dims.height), 0, 0);
            accCtx.drawImage(patch, frame.dims.left, frame.dims.top);

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(accumulator, 0, 0);

            decoded.frames.push(canvas);
            // GIF delays are in hundredths of a second.
            decoded.delays.push(Math.max(FurnitureBadgeDisplayVisualization.MIN_FRAME_DELAY_MS, (frame.delay || 10) * 10));
        }

        return decoded;
    }
}
