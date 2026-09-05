import { AvatarDirectionAngle, AvatarFigurePartType, AvatarScaleType, GeometryType, IActiveActionData, IAvatarImage, IGraphicAsset } from '@octane/api';
import { GraphicAsset } from '@octane/assets';
import { GetRenderer, GetTickerTime } from '@octane/utils';
import { Container, Matrix, Point, Rectangle, RenderTexture, Sprite, Texture } from 'pixi.js';
import { AvatarImageBodyPartContainer } from '../AvatarImageBodyPartContainer';
import { AvatarImagePartContainer } from '../AvatarImagePartContainer';
import { AvatarStructure } from '../AvatarStructure';
import { AssetAliasCollection } from '../alias';
import { AvatarAnimationLayerData } from '../animation';
import { AvatarCanvas } from '../structure';
import { AvatarImageActionCache } from './AvatarImageActionCache';
import { AvatarImageBodyPartCache } from './AvatarImageBodyPartCache';
import { AvatarImageDirectionCache } from './AvatarImageDirectionCache';
import { ImageData } from './ImageData';

export class AvatarImageCache
{
    private static DEFAULT_MAX_CACHE_STORAGE_TIME_MS: number = 60000;

    private _structure: AvatarStructure;
    private _avatar: IAvatarImage;
    private _assets: AssetAliasCollection;
    private _scale: string;
    private _cache: Map<string, AvatarImageBodyPartCache>;
    private _canvas: AvatarCanvas;
    private _disposed: boolean;
    private _geometryType: string;
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

                if(asset.texture instanceof RenderTexture) asset.texture.destroy(true);

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
        const bodyPartCache = this.getBodyPartCache(key) || new AvatarImageBodyPartCache();

        this._cache.set(key, bodyPartCache);

        let direction = bodyPartCache.getDirection();
        let action = bodyPartCache.getAction();
        let adjustedFrameCount = frameNumber;

        if(action.definition.startFromFrameZero) adjustedFrameCount -= action.startFrame;

        let adjustedAction = action;
        let removeData: string[] = [];
        let items: Map<string, string> = new Map();

        const positionOffset = new Point();

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

                    positionOffset.x = this._scale === AvatarScaleType.LARGE ? layerData.dx : layerData.dx / 2;
                    positionOffset.y = this._scale === AvatarScaleType.LARGE ? layerData.dy : layerData.dy / 2;

                    adjustedFrameCount = layerData.animationFrame;

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

        positionOffset.x += offset.x;
        positionOffset.y += offset.y;

        imageContainer.offset = positionOffset;

        return imageContainer;
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

                    let assetName = (this._scale + '_' + assetPartDefinition + '_' + partType + '_' + partId + '_' + assetDirection + '_' + frameNumber);
                    let asset = this._assets.getAsset(assetName);

                    if(!asset)
                    {
                        assetName = (this._scale + '_' + assetPartDefinition + '_' + partType + '_' + partId + '_' + assetDirection + '_0');
                        asset = this._assets.getAsset(assetName);
                    }

                    if(!asset)
                    {
                        assetName = (this._scale + '_' + this._defaultAction + '_' + partType + '_' + partId + '_' + assetDirection + '_' + frameNumber);
                        asset = this._assets.getAsset(assetName);
                    }

                    if(!asset)
                    {
                        assetName = (this._scale + '_' + this._defaultAction + '_' + partType + '_' + partId + '_' + assetDirection + '_0');
                        asset = this._assets.getAsset(assetName);
                    }

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

        const imageData = this.createUnionImage(this._unionImages, isFlipped);
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

        return new AvatarImageBodyPartContainer(imageData.container, offset, isCacheable);
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

        const renderer = GetRenderer();

        if(!renderer) return null;

        const halfWidth = Math.max(1, Math.round(largeAsset.width / 2));
        const halfHeight = Math.max(1, Math.round(largeAsset.height / 2));

        const renderTexture = RenderTexture.create({ width: halfWidth, height: halfHeight, resolution: 1 });
        const sprite = new Sprite(source);

        sprite.width = halfWidth;
        sprite.height = halfHeight;

        renderer.render({ container: sprite, target: renderTexture, clear: true });

        sprite.destroy();

        const fallback = GraphicAsset.createAsset((largeName + '_shfallback'), null, renderTexture, Math.round(largeAsset.x / 2), Math.round(largeAsset.y / 2), largeAsset.flipH, largeAsset.flipV, largeAsset.usesPalette);

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

    private createUnionImage(images: ImageData[], isFlipped: boolean): ImageData
    {
        const bounds = new Rectangle();

        for(const data of images) data && bounds.enlarge(data.offsetRect);

        const point = new Point(-(bounds.x), -(bounds.y));
        const container = new Container();

        const sprite = new Sprite(Texture.EMPTY);

        sprite.width = bounds.width;
        sprite.height = bounds.height;

        container.addChild(sprite);

        for(const data of images)
        {
            if(!data) continue;

            const regPoint = point.clone();

            regPoint.x -= data.regPoint.x;
            regPoint.y -= data.regPoint.y;

            if(isFlipped) regPoint.x = (container.width - (regPoint.x + data.rect.width));

            if(isFlipped != data.flipH)
            {
                this._matrix.a = -1;
                this._matrix.tx = ((data.rect.x + data.rect.width) + regPoint.x);
                this._matrix.ty = (regPoint.y - data.rect.y);
            }
            else
            {
                this._matrix.a = 1;
                this._matrix.tx = (regPoint.x - data.rect.x);
                this._matrix.ty = (regPoint.y - data.rect.y);
            }

            const sprite = new Sprite(data.texture);

            sprite.tint = data.colorTransform;
            sprite.setFromMatrix(this._matrix);

            container.addChild(sprite);
        }

        return new ImageData(null, container.getLocalBounds().rectangle, point, isFlipped, null, container);
    }
}
