import { AvatarDirectionAngle, AvatarFigurePartType, AvatarScaleType, GeometryType, IActiveActionData, IAvatarImage, IGraphicAsset, RoomObjectSpriteData } from '@octane/api';
import { getHalfSizeTexture, GraphicAsset, halfSizePadding } from '@octane/assets';
import { GetTickerTime } from '@octane/utils';
import { Matrix, Point, Rectangle } from 'pixi.js';
import { AvatarImageBodyPartContainer, AvatarPartLayer } from '../AvatarImageBodyPartContainer';
import { AvatarImagePartContainer } from '../AvatarImagePartContainer';
import { AvatarStructure } from '../AvatarStructure';
import { AssetAliasCollection } from '../alias';
import { AvatarAnimationLayerData } from '../animation';
import { AvatarCanvas } from '../structure';
import { AvatarImageActionCache } from './AvatarImageActionCache';
import { AvatarImageBodyPartCache } from './AvatarImageBodyPartCache';
import { AvatarImageDirectionCache } from './AvatarImageDirectionCache';
import { ImageData } from './ImageData';
import { AvatarScaleTextureCache } from './AvatarScaleTextureCache';

type AssetsByFrame = Map<number, IGraphicAsset>;

export class AvatarImageCache
{
    // Every avatar resolves its parts' assets through the same names (scale, action, part type and
    // id, direction, frame, with up to four fallbacks), and building and hashing those names was most
    // of the cost of a body part an avatar had not shown yet. Parts repeat across figures, so the
    // result is kept once for all avatars: part type -> part id -> action -> frame key -> asset or null.
    // It starts over whenever the alias collection's revision moves (any asset added, removed or
    // replaced in the asset manager, or any alias added), and when avatar libraries finish loading.
    // Ported from plus-emulator/volt-renderer (by Dennis, GPL-3.0).
    private static RESOLVED_ASSETS: Map<string, Map<string, Map<string, AssetsByFrame>>> = new Map();
    private static RESOLVED_ASSETS_OWNER: AssetAliasCollection = null;
    private static RESOLVED_ASSETS_REVISION: number = -1;

    public static clearResolvedAssets(): void
    {
        AvatarImageCache.RESOLVED_ASSETS.clear();
        AvatarImageCache.RESOLVED_ASSETS_OWNER = null;
        AvatarImageCache.RESOLVED_ASSETS_REVISION = -1;
    }

    private static DEFAULT_MAX_CACHE_STORAGE_TIME_MS: number = 60000;
    // Shared read-only defaults for the per-frame hot path — never mutate.
    private static EMPTY_REMOVE_DATA: string[] = [];
    private static EMPTY_ITEMS: Map<string, string> = new Map();

    private _structure: AvatarStructure;
    private _avatar: IAvatarImage;
    private _assets: AssetAliasCollection;
    private _scale: string;
    private _cache: Map<string, AvatarImageBodyPartCache>;
    private _canvas: AvatarCanvas;
    private _disposed: boolean;
    private _geometryType: string;
    private _hasAnimatedContent: boolean = false;
    private _defaultAction: string = 'std';
    private _unionImages: ImageData[];
    private _matrix: Matrix;
    private _fallbackAssets: Map<string, IGraphicAsset>;

    constructor(structure: AvatarStructure, avatar: IAvatarImage, assets: AssetAliasCollection, scale: string)
    {
        this._structure = structure;
        this._avatar = avatar;
        this._assets = assets;
        this._scale = scale;
        this._cache = new Map();
        this._canvas = null;
        this._disposed = false;
        this._unionImages = [];
        this._matrix = new Matrix();
        this._fallbackAssets = new Map();
    }

    public dispose(): void
    {
        if(this._disposed) return;

        this._structure = null;
        this._avatar = null;
        this._assets = null;
        this._canvas = null;
        this._disposed = true;

        if(this._fallbackAssets)
        {
            for(const asset of this._fallbackAssets.values())
            {
                if(!asset) continue;

                // Only a scaled-down copy is counted there; a real half-size sprite is left alone.
                AvatarScaleTextureCache.release(asset.texture);

                asset.recycle();
            }

            this._fallbackAssets.clear();
            this._fallbackAssets = null;
        }

        if(this._cache)
        {
            for(const cache of this._cache.values())
            {
                if(!cache) continue;

                cache.dispose();
            }

            this._cache = null;
        }

        if(this._unionImages)
        {
            for(const image of this._unionImages)
            {
                if(!image) continue;

                image.dispose();
            }

            this._unionImages = [];
        }
    }

    public disposeInactiveActions(maxAge: number = 60000): void
    {
        const time = GetTickerTime();

        if(this._cache)
        {
            for(const cache of this._cache.values())
            {
                if(!cache) continue;

                cache.disposeActions(maxAge, time);
            }
        }
    }

    public resetBodyPartCache(action: IActiveActionData): void
    {
        if(this._cache)
        {
            for(const cache of this._cache.values())
            {
                if(!cache) continue;

                cache.setAction(action, 0);
            }
        }
    }

    public setDirection(partType: string, direction: number): void
    {
        const parts = this._structure.getBodyPartsUnordered(partType);

        if(parts)
        {
            for(const part of parts)
            {
                const actionCache = this.getBodyPartCache(part);

                if(!actionCache) continue;

                actionCache.setDirection(direction);
            }
        }
    }

    public setAction(action: IActiveActionData, time: number): void
    {
        const bodyPartIds = this._structure.getActiveBodyPartIds(action, this._avatar);

        for(const bodyPartId of bodyPartIds)
        {
            const bodyPartCache = this.getBodyPartCache(bodyPartId);

            if(bodyPartCache) bodyPartCache.setAction(action, time);
        }
    }

    public setGeometryType(geometryType: string): void
    {
        if(this._geometryType === geometryType) return;

        if((((this._geometryType === GeometryType.SITTING) && (geometryType === GeometryType.VERTICAL)) || ((this._geometryType === GeometryType.VERTICAL) && (geometryType === GeometryType.SITTING)) || ((this._geometryType === GeometryType.SNOWWARS_HORIZONTAL) && (geometryType === GeometryType.SNOWWARS_HORIZONTAL))))
        {
            this.disposeInactiveActions(0);

            this._geometryType = geometryType;
            this._canvas = null;
            this._defaultAction = (geometryType === GeometryType.HORIZONTAL) ? 'lay' : 'std';

            return;
        }

        this.disposeInactiveActions(0);

        this._geometryType = geometryType;
        this._canvas = null;
        this._defaultAction = (geometryType === GeometryType.HORIZONTAL) ? 'lay' : 'std';
    }

    public getImageContainer(key: string, frameNumber: number, forceRefresh: boolean = false): AvatarImageBodyPartContainer
    {
        const bodyPartCache = this.getBodyPartCache(key);

        let direction = bodyPartCache.getDirection();
        let action = bodyPartCache.getAction();
        let adjustedFrameCount = frameNumber;

        if(action.definition.startFromFrameZero) adjustedFrameCount -= action.startFrame;

        let adjustedAction = action;
        let removeData: string[] = AvatarImageCache.EMPTY_REMOVE_DATA;
        let items: Map<string, string> = AvatarImageCache.EMPTY_ITEMS;

        let offsetX = 0;
        let offsetY = 0;

        if(action.definition.isAnimation)
        {
            let adjustedDirection = direction;

            const animation = this._structure.getAnimation(((action.definition.state + '.') + action.actionParameter));
            const animationFrameOffset = (frameNumber - action.startFrame);

            if(animation)
            {
                const layerData = animation.getLayerData(animationFrameOffset, key, action.overridingAction);

                if(layerData)
                {
                    adjustedDirection = (direction + layerData.dd + 8) % 8;

                    offsetX = this._scale === AvatarScaleType.LARGE ? layerData.dx : layerData.dx / 2;
                    offsetY = this._scale === AvatarScaleType.LARGE ? layerData.dy : layerData.dy / 2;

                    if(!layerData.usesFrameCounter) adjustedFrameCount = layerData.animationFrame;

                    if(layerData.action) action = layerData.action;

                    if(layerData.type === AvatarAnimationLayerData.BODYPART)
                    {
                        if(layerData.action) adjustedAction = layerData.action;

                        direction = adjustedDirection;
                    }
                    else if(layerData.type === AvatarAnimationLayerData.FX) direction = adjustedDirection;

                    items = layerData.items;
                }

                removeData = animation.removeData;
            }
        }

        let actionCache = bodyPartCache.getActionCache(adjustedAction);

        if(!actionCache || forceRefresh)
        {
            actionCache = new AvatarImageActionCache();
            bodyPartCache.updateActionCache(adjustedAction, actionCache);
        }

        let directionCache = actionCache.getDirectionCache(direction);

        if(!directionCache || forceRefresh)
        {
            const partList = this._structure.getParts(key, this._avatar.getFigure(), adjustedAction, this._geometryType, direction, removeData, this._avatar, items);

            directionCache = new AvatarImageDirectionCache(partList);

            actionCache.updateDirectionCache(direction, directionCache);
        }

        if(!directionCache.getPartList().length) return null;

        if(!this._hasAnimatedContent)
        {
            for(const part of directionCache.getPartList())
            {
                if(part.hasMultipleStaticFrames)
                {
                    this._hasAnimatedContent = true;

                    break;
                }
            }
        }

        let imageContainer = directionCache.getImageContainer(adjustedFrameCount);

        if(!imageContainer || forceRefresh)
        {
            const partList = directionCache.getPartList();

            imageContainer = this.renderBodyPart(direction, partList, adjustedFrameCount, action);

            if(imageContainer && !forceRefresh)
            {
                if(imageContainer.isCacheable) directionCache.updateImageContainer(imageContainer, adjustedFrameCount);
            }
            else
            {
                return null;
            }
        }

        const offset = this._structure.getFrameBodyPartOffset(adjustedAction, direction, adjustedFrameCount, key);

        // The container keeps its own offset point, so nothing is allocated per body part per redraw.
        imageContainer.setOffset((offsetX + offset.x), (offsetY + offset.y));

        return imageContainer;
    }

    /**
     * Behaviour from the AIR client (AvatarImageCache.getImageContainer with server render data, renderBodyPart):
     * the parts of one body part as camera scene sprites, named after the figure library asset each part draws
     * (e.g. h_std_hd_1_2_0), with AIR's placement, flip and colour. Nothing is drawn and no cache is touched.
     */
    public collectServerRenderData(key: string, frameNumber: number, target: RoomObjectSpriteData[]): void
    {
        const bodyPartCache = this.getBodyPartCache(key);

        let direction = bodyPartCache.getDirection();
        let action = bodyPartCache.getAction();

        if(!action || !action.definition) return;

        let adjustedFrameCount = frameNumber;

        if(action.definition.startFromFrameZero) adjustedFrameCount -= action.startFrame;

        let adjustedAction = action;
        let removeData: string[] = AvatarImageCache.EMPTY_REMOVE_DATA;
        let items: Map<string, string> = AvatarImageCache.EMPTY_ITEMS;

        const positionOffset = new Point();

        if(action.definition.isAnimation)
        {
            const animation = this._structure.getAnimation(((action.definition.state + '.') + action.actionParameter));

            if(animation)
            {
                const layerData = animation.getLayerData((frameNumber - action.startFrame), key, action.overridingAction);

                if(layerData)
                {
                    const adjustedDirection = (direction + layerData.dd + 8) % 8;

                    positionOffset.x = this._scale === AvatarScaleType.LARGE ? layerData.dx : layerData.dx / 2;
                    positionOffset.y = this._scale === AvatarScaleType.LARGE ? layerData.dy : layerData.dy / 2;

                    if(!layerData.usesFrameCounter) adjustedFrameCount = layerData.animationFrame;

                    if(layerData.action) action = layerData.action;

                    if(layerData.type === AvatarAnimationLayerData.BODYPART)
                    {
                        if(layerData.action) adjustedAction = layerData.action;

                        direction = adjustedDirection;
                    }
                    else if(layerData.type === AvatarAnimationLayerData.FX) direction = adjustedDirection;

                    items = layerData.items;
                }

                removeData = animation.removeData;
            }
        }

        const directionCache = bodyPartCache.getActionCache(adjustedAction)?.getDirectionCache(direction);
        const partList = directionCache ? directionCache.getPartList() : this._structure.getParts(key, this._avatar.getFigure(), adjustedAction, this._geometryType, direction, removeData, this._avatar, items);

        if(!partList || !partList.length) return;

        const firstIndex = target.length;

        this.collectBodyPartData(direction, partList, adjustedFrameCount, action, target);

        const offset = this._structure.getFrameBodyPartOffset(adjustedAction, direction, adjustedFrameCount, key);

        positionOffset.x += offset.x;
        positionOffset.y += offset.y;

        for(let index = firstIndex; index < target.length; index++)
        {
            target[index].x = Math.trunc(target[index].x + positionOffset.x);
            target[index].y = Math.trunc(target[index].y + positionOffset.y);
        }
    }

    private collectBodyPartData(direction: number, containers: AvatarImagePartContainer[], frameCount: number, action: IActiveActionData, target: RoomObjectSpriteData[]): void
    {
        const isFlipped = AvatarDirectionAngle.DIRECTION_IS_FLIPPED[direction] || false;
        const isLarge = (this._scale === AvatarScaleType.LARGE);
        let assetPartDefinition = action.definition.assetPartDefinition;
        let containerIndex = (containers.length - 1);

        while(containerIndex >= 0)
        {
            const container = containers[containerIndex];

            containerIndex--;

            if((direction == 7) && ((container.partType === 'fc') || (container.partType === 'ey'))) continue;

            if((container.partType === 'ri') && !container.partId) continue;

            const partId = container.partId;
            const animationFrame = container.getFrameDefinition(frameCount);

            let partType = container.partType;
            let frameNumber = 0;

            if(animationFrame)
            {
                frameNumber = animationFrame.number;

                if((animationFrame.assetPartDefinition) && (animationFrame.assetPartDefinition !== '')) assetPartDefinition = animationFrame.assetPartDefinition;
            }
            else frameNumber = container.getFrameIndex(frameCount);

            let assetDirection = direction;
            let flipH = false;

            if(isFlipped)
            {
                if(((assetPartDefinition === 'wav') && (((partType === AvatarFigurePartType.LEFT_HAND) || (partType === AvatarFigurePartType.LEFT_SLEEVE)) || (partType === AvatarFigurePartType.LEFT_COAT_SLEEVE))) || ((assetPartDefinition === 'drk') && (((partType === AvatarFigurePartType.RIGHT_HAND) || (partType === AvatarFigurePartType.RIGHT_SLEEVE)) || (partType === AvatarFigurePartType.RIGHT_COAT_SLEEVE))) || ((assetPartDefinition === 'blw') && (partType === AvatarFigurePartType.RIGHT_HAND)) || ((assetPartDefinition === 'sig') && (partType === AvatarFigurePartType.LEFT_HAND)) || ((assetPartDefinition === 'respect') && (partType === AvatarFigurePartType.LEFT_HAND)) || (partType === AvatarFigurePartType.RIGHT_HAND_ITEM) || (partType === AvatarFigurePartType.LEFT_HAND_ITEM) || (partType === AvatarFigurePartType.CHEST_PRINT))
                {
                    flipH = true;
                }
                else
                {
                    if(direction === 4) assetDirection = 2;
                    else if(direction === 5) assetDirection = 1;
                    else if(direction === 6) assetDirection = 0;

                    if(container.flippedPartType !== partType) partType = container.flippedPartType;
                }
            }

            const candidates = [
                (this._scale + '_' + assetPartDefinition + '_' + partType + '_' + partId + '_' + assetDirection + '_' + frameNumber),
                (this._scale + '_' + assetPartDefinition + '_' + partType + '_' + partId + '_' + assetDirection + '_0'),
                (this._scale + '_' + this._defaultAction + '_' + partType + '_' + partId + '_' + assetDirection + '_' + frameNumber),
                (this._scale + '_' + this._defaultAction + '_' + partType + '_' + partId + '_' + assetDirection + '_0')
            ];

            let assetName: string = null;
            let asset: IGraphicAsset = null;

            for(const candidate of candidates)
            {
                asset = this._assets.getAsset(candidate);

                if(asset)
                {
                    assetName = candidate;
                    break;
                }
            }

            if(!asset) continue;

            const offset = new Point(-(asset.x), -(asset.y));

            if(flipH) offset.x = (offset.x + (isLarge ? 65 : 31));

            const data = new RoomObjectSpriteData();

            data.name = this._assets.getAssetName(assetName);
            data.x = Math.trunc(-(offset.x) - 33);
            data.y = Math.trunc(-(offset.y));
            data.z = (target.length * -0.0001);
            data.width = Math.trunc(asset.rectangle.width);
            data.height = Math.trunc(asset.rectangle.height);
            data.flipH = flipH;

            if(assetPartDefinition === 'lay') data.x += 53;

            if(isFlipped)
            {
                data.flipH = !data.flipH;

                if(data.flipH) data.x = Math.trunc(-(data.x) - asset.width);
                else data.x += 65;
            }

            if(container.isColorable && container.color)
            {
                // AIR: "0x" + two lowercase hex digits per channel of the part's colour transform.
                data.color = '0x' + (container.color.rgb & 0xFFFFFF).toString(16).padStart(6, '0');
            }

            target.push(data);
        }
    }

    public get hasAnimatedContent(): boolean
    {
        return this._hasAnimatedContent;
    }

    public getBodyPartCache(key: string): AvatarImageBodyPartCache
    {
        let existing = this._cache.get(key);

        if(!existing)
        {
            existing = new AvatarImageBodyPartCache();

            this._cache.set(key, existing);
        }

        return existing;
    }

    private renderBodyPart(direction: number, containers: AvatarImagePartContainer[], frameCount: number, action: IActiveActionData): AvatarImageBodyPartContainer
    {
        if(!containers || !containers.length) return null;

        if(!this._canvas)
        {
            this._canvas = this._structure.getCanvas(this._scale, this._geometryType);

            if(!this._canvas) return null;
        }

        const isFlipped = AvatarDirectionAngle.DIRECTION_IS_FLIPPED[direction] || false;
        let assetPartDefinition = action.definition.assetPartDefinition;
        let isCacheable = true;
        let containerIndex = (containers.length - 1);

        while(containerIndex >= 0)
        {
            const container = containers[containerIndex];

            let color = 16777215;

            if(!((direction == 7) && ((container.partType === 'fc') || (container.partType === 'ey'))))
            {
                if(!((container.partType === 'ri') && !container.partId))
                {
                    const partId = container.partId;
                    const animationFrame = container.getFrameDefinition(frameCount);

                    let partType = container.partType;
                    let frameNumber = 0;

                    if(animationFrame)
                    {
                        frameNumber = animationFrame.number;

                        if((animationFrame.assetPartDefinition) && (animationFrame.assetPartDefinition !== '')) assetPartDefinition = animationFrame.assetPartDefinition;
                    }
                    else frameNumber = container.getFrameIndex(frameCount);

                    let assetDirection = direction;
                    let flipH = false;

                    if(isFlipped)
                    {
                        if(((assetPartDefinition === 'wav') && (((partType === AvatarFigurePartType.LEFT_HAND) || (partType === AvatarFigurePartType.LEFT_SLEEVE)) || (partType === AvatarFigurePartType.LEFT_COAT_SLEEVE))) || ((assetPartDefinition === 'drk') && (((partType === AvatarFigurePartType.RIGHT_HAND) || (partType === AvatarFigurePartType.RIGHT_SLEEVE)) || (partType === AvatarFigurePartType.RIGHT_COAT_SLEEVE))) || ((assetPartDefinition === 'blw') && (partType === AvatarFigurePartType.RIGHT_HAND)) || ((assetPartDefinition === 'sig') && (partType === AvatarFigurePartType.LEFT_HAND)) || ((assetPartDefinition === 'respect') && (partType === AvatarFigurePartType.LEFT_HAND)) || (partType === AvatarFigurePartType.RIGHT_HAND_ITEM) || (partType === AvatarFigurePartType.LEFT_HAND_ITEM) || (partType === AvatarFigurePartType.CHEST_PRINT))
                        {
                            flipH = true;
                        }
                        else
                        {
                            if(direction === 4) assetDirection = 2;
                            else if(direction === 5) assetDirection = 1;
                            else if(direction === 6) assetDirection = 0;

                            if(container.flippedPartType !== partType) partType = container.flippedPartType;
                        }
                    }

                    let asset = this.resolveAsset(assetPartDefinition, partType, partId, assetDirection, frameNumber);

                    if(!asset && (this._scale !== AvatarScaleType.LARGE))
                    {
                        asset = this.getSmallScaleFallbackAsset(assetPartDefinition, partType, partId, assetDirection, frameNumber);
                    }

                    if(asset)
                    {
                        const texture = asset.texture;

                        if(!texture || !texture.source)
                        {
                            isCacheable = false;
                        }
                        else
                        {
                            if(container.isColorable && container.color) color = container.color.rgb;

                            const offset = new Point(-(asset.x), -(asset.y));

                            if(flipH) offset.x = (offset.x + ((this._scale === AvatarScaleType.LARGE) ? 65 : 31));

                            this._unionImages.push(new ImageData(texture, asset.rectangle, offset, flipH, color));
                        }
                    }
                }
            }

            containerIndex--;
        }

        if(!this._unionImages.length) return null;

        const layers: AvatarPartLayer[] = [];
        const imageData = this.createUnionImage(this._unionImages, isFlipped, layers);
        const canvasOffset = ((this._scale === AvatarScaleType.LARGE) ? (this._canvas.height - 16) : (this._canvas.height - 8));
        const offset = new Point(-(imageData.regPoint.x), (canvasOffset - imageData.regPoint.y));

        if(isFlipped && (assetPartDefinition !== 'lay')) offset.x = (offset.x + ((this._scale === AvatarScaleType.LARGE) ? 67 : 31));

        let imageIndex = (this._unionImages.length - 1);

        while(imageIndex >= 0)
        {
            const unionImage = this._unionImages.pop();

            if(unionImage) unionImage.dispose();

            imageIndex--;
        }

        return new AvatarImageBodyPartContainer(layers, imageData.width, imageData.height, offset, isCacheable, imageData.rect);
    }

    /** The part's asset through the four names AIR tries, looked up once for all avatars (see RESOLVED_ASSETS). */
    private resolveAsset(assetPartDefinition: string, partType: string, partId: string, direction: number, frameNumber: number): IGraphicAsset
    {
        const revision = this._assets.revision;

        // Without a revision a cached answer could not be known to be current, so every lookup goes to the assets.
        if(revision < 0) return this.findAsset(assetPartDefinition, partType, partId, direction, frameNumber);

        if((AvatarImageCache.RESOLVED_ASSETS_OWNER !== this._assets) || (AvatarImageCache.RESOLVED_ASSETS_REVISION !== revision))
        {
            AvatarImageCache.RESOLVED_ASSETS.clear();
            AvatarImageCache.RESOLVED_ASSETS_OWNER = this._assets;
            AvatarImageCache.RESOLVED_ASSETS_REVISION = revision;
        }

        let byId = AvatarImageCache.RESOLVED_ASSETS.get(partType);

        if(!byId) AvatarImageCache.RESOLVED_ASSETS.set(partType, (byId = new Map()));

        let byAction = byId.get(partId);

        if(!byAction) byId.set(partId, (byAction = new Map()));

        let byFrame = byAction.get(assetPartDefinition);

        if(!byFrame) byAction.set(assetPartDefinition, (byFrame = new Map()));

        // Frame, direction, the scale and the default action, in one number.
        const key = ((((frameNumber * 16) + direction) * 4) + ((this._scale === AvatarScaleType.LARGE) ? 0 : 2) + ((this._defaultAction === 'std') ? 0 : 1));
        const cached = byFrame.get(key);

        if((cached !== undefined) && (!cached || !cached.texture || !cached.texture.destroyed)) return cached;

        const asset = this.findAsset(assetPartDefinition, partType, partId, direction, frameNumber);

        byFrame.set(key, asset);

        return asset;
    }

    private findAsset(assetPartDefinition: string, partType: string, partId: string, direction: number, frameNumber: number): IGraphicAsset
    {
        let asset = this._assets.getAsset(this._scale + '_' + assetPartDefinition + '_' + partType + '_' + partId + '_' + direction + '_' + frameNumber);

        if(!asset) asset = this._assets.getAsset(this._scale + '_' + assetPartDefinition + '_' + partType + '_' + partId + '_' + direction + '_0');
        if(!asset) asset = this._assets.getAsset(this._scale + '_' + this._defaultAction + '_' + partType + '_' + partId + '_' + direction + '_' + frameNumber);
        if(!asset) asset = this._assets.getAsset(this._scale + '_' + this._defaultAction + '_' + partType + '_' + partId + '_' + direction + '_0');

        return (asset ?? null);
    }

    private getSmallScaleFallbackAsset(assetPartDefinition: string, partType: string, partId: string, assetDirection: number, frameNumber: number): IGraphicAsset
    {
        const large = AvatarScaleType.LARGE;

        let largeName = (large + '_' + assetPartDefinition + '_' + partType + '_' + partId + '_' + assetDirection + '_' + frameNumber);
        let largeAsset = this._assets.getAsset(largeName);

        if(!largeAsset)
        {
            largeName = (large + '_' + assetPartDefinition + '_' + partType + '_' + partId + '_' + assetDirection + '_0');
            largeAsset = this._assets.getAsset(largeName);
        }

        if(!largeAsset)
        {
            largeName = (large + '_' + this._defaultAction + '_' + partType + '_' + partId + '_' + assetDirection + '_' + frameNumber);
            largeAsset = this._assets.getAsset(largeName);
        }

        if(!largeAsset)
        {
            largeName = (large + '_' + this._defaultAction + '_' + partType + '_' + partId + '_' + assetDirection + '_0');
            largeAsset = this._assets.getAsset(largeName);
        }

        if(!largeAsset) return null;

        const existing = this._fallbackAssets.get(largeName);

        if(existing) return existing;

        const source = largeAsset.texture;

        if(!source || !source.source) return null;

        // A real half-size sprite (2x2 blocks, outlines kept) on the same 2px grid for every part, so a
        // figure without "sh" assets (Habbo's .hab clothes) stays sharp and holds together when zoomed out.
        const halfTexture = getHalfSizeTexture(source, halfSizePadding(largeAsset.x), halfSizePadding(largeAsset.y));

        if(halfTexture)
        {
            const halfAsset = GraphicAsset.createAsset((largeName + '_shfallback'), null, halfTexture, Math.floor(largeAsset.x / 2), Math.floor(largeAsset.y / 2), largeAsset.flipH, largeAsset.flipV, largeAsset.usesPalette);

            this._fallbackAssets.set(largeName, halfAsset);

            return halfAsset;
        }

        // No half-size sprite could be made: one scaled-down copy per source texture, shared by every avatar.
        const texture = AvatarScaleTextureCache.acquire(source);

        if(!texture) return null;

        const fallback = GraphicAsset.createAsset((largeName + '_shfallback'), null, texture, Math.round(largeAsset.x / 2), Math.round(largeAsset.y / 2), largeAsset.flipH, largeAsset.flipV, largeAsset.usesPalette);

        this._fallbackAssets.set(largeName, fallback);

        return fallback;
    }

    private convertColorToHex(color: number): string
    {
        let hex: string = (color * 0xFF).toString(16);
        if(hex.length < 2)
        {
            hex = ('0' + hex);
        }
        return hex;
    }

    // Lays the part's assets out in one rectangle and returns the layers in it. Same placement as the
    // container it used to build: a sizing sprite over the union, then one sprite per asset.
    private createUnionImage(images: ImageData[], isFlipped: boolean, layers: AvatarPartLayer[]): { rect: Rectangle, regPoint: Point, width: number, height: number }
    {
        // The union starts at the origin, as the container version did, so part bounds stay what they were.
        const bounds = new Rectangle();

        for(const data of images) data && bounds.enlarge(data.offsetRect);

        const pointX = -(bounds.x);
        const pointY = -(bounds.y);
        const width = Math.max(0, bounds.width);
        const height = Math.max(0, bounds.height);

        // Local bounds of the laid-out part: the sizing sprite plus every layer.
        let minX = 0;
        let minY = 0;
        let maxX = width;
        let maxY = height;
        // The old container's width grew with each sprite already added; the flipped placement used it.
        let containerWidth = width;

        for(const data of images)
        {
            if(!data) continue;

            let regX = (pointX - data.regPoint.x);
            const regY = (pointY - data.regPoint.y);

            if(isFlipped) regX = (containerWidth - (regX + data.rect.width));

            const flipped = (isFlipped != data.flipH);
            const x = flipped ? ((data.rect.x + data.rect.width) + regX) : (regX - data.rect.x);
            const y = (regY - data.rect.y);
            // Pixi's quad bounds: the trimmed rectangle when there is one.
            const trim = data.texture.trim;
            const orig = data.texture.orig;
            const quadMinX = trim ? trim.x : 0;
            const quadMaxX = trim ? (trim.x + trim.width) : orig.width;
            const quadMinY = trim ? trim.y : 0;
            const quadMaxY = trim ? (trim.y + trim.height) : orig.height;
            const left = flipped ? (x - quadMaxX) : (x + quadMinX);
            const right = flipped ? (x - quadMinX) : (x + quadMaxX);

            layers.push({ texture: data.texture, flipped, x, y, tint: data.colorTransform });

            if(left < minX) minX = left;
            if((y + quadMinY) < minY) minY = (y + quadMinY);
            if(right > maxX) maxX = right;
            if((y + quadMaxY) > maxY) maxY = (y + quadMaxY);

            containerWidth = (maxX - minX);
        }

        const rect = new Rectangle(minX, minY, (maxX - minX), (maxY - minY));
        const regPoint = new Point(pointX, pointY);

        // ImageData flipped the registration point by the part's width.
        if(isFlipped) regPoint.x = (-(regPoint.x) + rect.width);

        return { rect, regPoint, width, height };
    }
}
