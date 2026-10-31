import { AvatarAction, AvatarScaleType, AvatarSetType, IActiveActionData, IAnimationLayerData, IAvatarDataContainer, IAvatarEffectListener, IAvatarFigureContainer, IAvatarImage, IGraphicAsset, IPartColor, ISpriteDataContainer, RoomObjectSpriteData } from '@octane/api';
import { GetRenderer, GetTexturePool, GetTickerTime, PaletteMapFilter, TextureUtils } from '@octane/utils';
import { ColorMatrixFilter, Container, Filter, ICanvas, RenderTexture, Sprite, Texture } from 'pixi.js';
import { AvatarFigureContainer } from './AvatarFigureContainer';
import { AvatarImageBodyPartContainer } from './AvatarImageBodyPartContainer';
import { AvatarStructure } from './AvatarStructure';
import { EffectAssetDownloadManager } from './EffectAssetDownloadManager';
import { ActiveActionData } from './actions';
import { AssetAliasCollection } from './alias';
import { AvatarImageCache } from './cache';
import { AvatarFrameTexture, AvatarFrameTextureCache } from './cache/AvatarFrameTextureCache';
import { AvatarCanvas } from './structure';

type PreparedAvatarPart = { image: Container; x: number; y: number };

export class AvatarImage implements IAvatarImage, IAvatarEffectListener
{
    private static CHANNELS_EQUAL: string = 'CHANNELS_EQUAL';
    private static CHANNELS_UNIQUE: string = 'CHANNELS_UNIQUE';
    private static CHANNELS_RED: string = 'CHANNELS_RED';
    private static CHANNELS_GREEN: string = 'CHANNELS_GREEN';
    private static CHANNELS_BLUE: string = 'CHANNELS_BLUE';
    private static CHANNELS_DESATURATED: string = 'CHANNELS_DESATURATED';
    private static DEFAULT_ACTION: string = 'Default';
    private static DEFAULT_DIRECTION: number = 2;
    private static DEFAULT_AVATAR_SET: string = AvatarSetType.FULL;

    protected _mainDirection: number;
    protected _headDirection: number;
    protected _mainAction: IActiveActionData;
    protected _disposed: boolean = false;
    protected _canvasOffsets: number[] = [];
    protected _cache: AvatarImageCache;
    protected _avatarSpriteData: IAvatarDataContainer;
    protected _actions: ActiveActionData[] = [];
    protected _activeTexture: Texture = null;

    private _defaultAction: IActiveActionData = null;
    private _frameCounter: number = 0;
    private _directionOffset: number = 0;
    // The direction without the animation offset, so a per-frame offset can be re-applied as the frame counter moves.
    private _baseMainDirection: number = 0;
    private _baseHeadDirection: number = 0;
    private _directionAnimationId: string = null;
    private _directionAnimationStartFrame: number = 0;
    private _directionAnimationActionName: string = null;
    private _changes: boolean = true;
    private _textureRevision: number = 0;
    private _sprites: ISpriteDataContainer[];
    private _isAnimating: boolean = false;
    private _animationHasResetOnToggle: boolean = false;
    private _actionsSorted: boolean = false;
    private _sortedActions: IActiveActionData[];
    private _lastActionsString: string = null;
    private _currentActionsString: string = null;
    private _effectIdInUse: number = -1;
    // The running effect animation keeps the frame it started on, so other actions don't restart it.
    private _effectAnimationId: string = null;
    private _effectAnimationStartFrame: number = 0;
    private _animationFrameCount: number = -1;
    private _cachedBodyParts: string[] = [];
    private _cachedBodyPartsDirection: number = -1;
    private _cachedBodyPartsGeometryType: string = null;
    private _cachedBodyPartsAvatarSet: string = null;
    private _grayscaleFilter: ColorMatrixFilter = null;
    private _grayscaleFilterChannel: string = null;
    private _paletteMapFilter: PaletteMapFilter = null;
    private _paletteMapFilterSource: IAvatarDataContainer = null;
    private _transientBodyParts: AvatarImageBodyPartContainer[] = [];
    private _sharedFrame: AvatarFrameTexture = null;
    private _activeSetType: string = null;
    // At most eight non-owning hints per image; only the active frame borrows GPU storage.
    private _compositions: Map<string, WeakRef<AvatarFrameTexture>> = new Map();
    private _compositionRevision: number = -1;

    constructor(
        private _structure: AvatarStructure,
        private _assets: AssetAliasCollection,
        private _figure: AvatarFigureContainer,
        private _scale: string,
        private _effectManager: EffectAssetDownloadManager,
        private _effectListener: IAvatarEffectListener = null,
        private _frameTextures: AvatarFrameTextureCache = null)
    {
        if(!this._figure) this._figure = new AvatarFigureContainer('hr-893-45.hd-180-2.ch-210-66.lg-270-82.sh-300-91.wa-2007-.ri-1-');
        if(!this._scale) this._scale = AvatarScaleType.LARGE;

        this._cache = new AvatarImageCache(this._structure, this, this._assets, this._scale);
        this.setDirection(AvatarImage.DEFAULT_AVATAR_SET, AvatarImage.DEFAULT_DIRECTION);
        this._defaultAction = new ActiveActionData(AvatarAction.POSTURE_STAND);
        this._defaultAction.definition = this._structure.getActionDefinition(AvatarImage.DEFAULT_ACTION);
        this.resetActions();
        this._animationFrameCount = 0;
    }

    public disposeInactiveActions(): void
    {
        this._cache?.disposeInactiveActions();
    }

    public dispose(): void
    {
        if(this._disposed) return;

        // The shared geometry keeps effect-added parts keyed by this image.
        this._structure?.removeDynamicItems(this);
        this._structure = null;
        this._effectListener = null;
        this._effectManager = null;
        this._sortedActions = null;
        this._assets = null;
        this._mainAction = null;
        this._figure = null;
        this._avatarSpriteData = null;
        this._actions = null;

        this.releaseActiveTexture();
        this._compositions.clear();
        this._frameTextures = null;

        if(this._cache)
        {
            this._cache.dispose();
            this._cache = null;
        }

        this.disposeTransientBodyParts();
        this.disposeFilters();

        this._canvasOffsets = null;
        this._disposed = true;
    }

    // The effect's avatar data (palette, ink), read by the camera scene like AIR's avatarSpriteData.
    public get avatarSpriteData(): IAvatarDataContainer
    {
        return this._avatarSpriteData;
    }

    public get disposed(): boolean
    {
        return this._disposed;
    }

    public getFigure(): IAvatarFigureContainer
    {
        return this._figure;
    }

    public getScale(): string
    {
        return this._scale;
    }

    public getPartColor(partType: string): IPartColor
    {
        return this._structure.getPartColor(this._figure, partType);
    }

    public setDirection(avatarPart: string, direction: number): void
    {
        if(this._structure.isMainAvatarSet(avatarPart)) this._baseMainDirection = direction;

        if(avatarPart === AvatarSetType.HEAD || avatarPart === AvatarSetType.FULL) this._baseHeadDirection = direction;

        this.setDirectionWithOffset(avatarPart, direction);
    }

    private setDirectionWithOffset(avatarPart: string, direction: number): void
    {
        direction = (((direction + this._directionOffset) % 8) + 8) % 8;

        if(this._structure.isMainAvatarSet(avatarPart)) this._mainDirection = direction;

        // Special handling for head direction, including prevention checks for turning
        if(avatarPart === AvatarSetType.HEAD || avatarPart === AvatarSetType.FULL)
        {
            if(avatarPart === AvatarSetType.HEAD && this.isHeadTurnPreventedByAction()) direction = this._mainDirection;

            this._headDirection = direction;
        }

        this._cache.setDirection(avatarPart, direction);
        this._changes = true;
    }

    public setDirectionAngle(avatarSet: string, angle: number): void
    {
        this.setDirection(avatarSet, Math.floor(angle / 45));
    }

    public getSprites(): ISpriteDataContainer[]
    {
        return this._sprites;
    }

    public getCanvasOffsets(): number[]
    {
        return this._canvasOffsets;
    }

    public getMainAction(): IActiveActionData
    {
        return this._mainAction;
    }

    public getEffectId(): number
    {
        return this._effectIdInUse;
    }

    public getLayerData(sprite: ISpriteDataContainer): IAnimationLayerData
    {
        let frame = this._frameCounter;

        if(sprite.animation.id === this._effectAnimationId) frame -= this._effectAnimationStartFrame;

        return this._structure.getBodyPartData(sprite.animation.id, frame, sprite.id);
    }

    public updateAnimationByFrames(frameCount: number = 1): void
    {
        this._frameCounter += frameCount;
        this.updateDirectionOffset();
        this._changes = true;
    }

    public resetAnimationFrameCounter(): void
    {
        this._frameCounter = 0;

        if(this._directionAnimationId === this._effectAnimationId) this._directionAnimationStartFrame = 0;

        this._effectAnimationStartFrame = 0;
        this.updateDirectionOffset();
        this._changes = true;
    }

    private setDirectionOffset(offset: number): void
    {
        if(this._directionOffset === offset) return;

        this._directionOffset = offset;

        this.setDirectionWithOffset(AvatarSetType.FULL, this._baseMainDirection);

        if(this._baseHeadDirection !== this._baseMainDirection) this.setDirectionWithOffset(AvatarSetType.HEAD, this._baseHeadDirection);
    }

    /** Official AvatarImage.updateDirectionOffset: the running direction animation's offset for the current frame. */
    private updateDirectionOffset(): void
    {
        let offset = 0;

        if(this._directionAnimationId)
        {
            const animation = this._structure.getAnimation(this._directionAnimationId);

            if(animation) offset = animation.getDirectionOffset((this._frameCounter - this._directionAnimationStartFrame), this._directionAnimationActionName);
        }

        this.setDirectionOffset(offset);
    }

    /**
     * Behaviour from the AIR client (AvatarImage.getServerRenderData / getAvatarPartsForCamera): every part of the
     * full figure, body parts walked back to front, as the camera scene sends it to the server.
     */
    public getServerRenderData(): RoomObjectSpriteData[]
    {
        const data: RoomObjectSpriteData[] = [];

        if(this._disposed || !this._mainAction || !this._mainAction.definition || !this._cache) return data;

        const geometryType = this._mainAction.definition.geometryType;

        if(!this._structure.getCanvas(this._scale, geometryType)) return data;

        const bodyParts = this.getBodyParts(AvatarSetType.FULL, geometryType, this._mainDirection) || [];

        for(let index = (bodyParts.length - 1); index >= 0; index--) this._cache.collectServerRenderData(bodyParts[index], this._frameCounter, data);

        return data;
    }

    private getBodyParts(avatarSet: string, geometryType: string, direction: number): string[]
    {
        const shouldUpdateCache = direction !== this._cachedBodyPartsDirection || geometryType !== this._cachedBodyPartsGeometryType || avatarSet !== this._cachedBodyPartsAvatarSet;

        if(shouldUpdateCache)
        {
            this._cachedBodyPartsDirection = direction;
            this._cachedBodyPartsGeometryType = geometryType;
            this._cachedBodyPartsAvatarSet = avatarSet;

            this._cachedBodyParts = this._structure.getBodyParts(avatarSet, geometryType, direction);
        }

        return this._cachedBodyParts;
    }

    private prepareBodyParts(avatarCanvas: AvatarCanvas, setType: string): PreparedAvatarPart[]
    {
        const bodyParts = this.getBodyParts(setType, this._mainAction.definition.geometryType, this._mainDirection);
        const parts: PreparedAvatarPart[] = [];

        this._transientBodyParts.length = 0;

        for(let index = (bodyParts.length - 1); index >= 0; index--)
        {
            const part = this._cache.getImageContainer(bodyParts[index], this._frameCounter);

            if(!part || !part.image) continue;

            if(!part.isCacheable) this._transientBodyParts.push(part);

            const point = part.regPoint;

            parts.push({
                image: part.image,
                x: Math.floor(point.x + avatarCanvas.offset.x + avatarCanvas.regPoint.x),
                y: Math.floor(point.y + avatarCanvas.offset.y + avatarCanvas.regPoint.y)
            });
        }

        return parts;
    }

    private buildAvatarContainer(avatarCanvas: AvatarCanvas, setType: string, parts: PreparedAvatarPart[] = this.prepareBodyParts(avatarCanvas, setType)): Container
    {
        const container = new Container();

        for(const part of parts)
        {
            const partContainer = new Container();

            partContainer.addChild(part.image);
            partContainer.position.set(part.x, part.y);
            container.addChild(partContainer);
        }

        if(this._avatarSpriteData)
        {
            const filters: Filter[] = [];

            if(this._avatarSpriteData.colorTransform) filters.push(this._avatarSpriteData.colorTransform);

            if(this._avatarSpriteData.paletteIsGrayscale)
            {
                this.convertToGrayscale(container);

                filters.push(this.getPaletteMapFilter(this._avatarSpriteData));
            }

            if(filters.length) container.filters = filters;
        }

        return container;
    }

    public get textureRevision(): number
    {
        return this._textureRevision;
    }

    public processAsTexture(setType: string, hightlight: boolean): Texture
    {
        const revision = AvatarFrameTextureCache.revision;

        // An asset, UV or sampling change anywhere invalidates every composition hint.
        if(this._compositionRevision !== revision)
        {
            this._compositions.clear();
            this._compositionRevision = revision;
            this._changes = true;
        }

        if(!this._changes && (this._activeSetType === setType) && (!this._sharedFrame || this._sharedFrame.cached)) return this._activeTexture;

        // Past the early return the frame may be drawn again, possibly into the same texture.
        this._textureRevision++;

        if(!this._mainAction) return null;

        if(!this._actionsSorted) this.endActionAppends();

        const avatarCanvas = this._structure.getCanvas(this._scale, this._mainAction.definition.geometryType);

        if(!avatarCanvas) return null;

        const parts = this.prepareBodyParts(avatarCanvas, setType);

        // Cached body-part trees do not change until they are disposed or replaced, so the parts and
        // their placement name the finished frame. Filters and transient parts take the private path.
        let key: string = null;

        if(this._frameTextures && !this._avatarSpriteData && !this._transientBodyParts.length)
        {
            key = `${ avatarCanvas.width },${ avatarCanvas.height }`;

            for(const part of parts) key += `|${ part.image.uid },${ part.x },${ part.y }`;

            const hint = this._compositions.get(key);
            const cached = this._frameTextures.acquireCached(hint?.deref());

            if(cached)
            {
                this._compositions.delete(key);
                this._compositions.set(key, hint);
                this.releaseActiveTexture();
                this._sharedFrame = cached;
                this._activeTexture = cached.texture;
                this._changes = false;
                this._activeSetType = setType;

                return this._activeTexture;
            }
        }

        const container = this.buildAvatarContainer(avatarCanvas, setType, parts);

        try
        {
            const sharedFrame = !this._transientBodyParts.length ? this._frameTextures?.acquire(container, avatarCanvas.width, avatarCanvas.height) : null;

            if(sharedFrame)
            {
                this.releaseActiveTexture();
                this._sharedFrame = sharedFrame;
                this._activeTexture = sharedFrame.texture;

                if(key !== null)
                {
                    this._compositions.delete(key);
                    this._compositions.set(key, new WeakRef(sharedFrame));

                    if(this._compositions.size > 8) this._compositions.delete(this._compositions.keys().next().value);
                }
            }
            else
            {
                const reuse = (this._activeTexture && !this._sharedFrame && (this._activeTexture.width === avatarCanvas.width) && (this._activeTexture.height === avatarCanvas.height));
                const texture = reuse ? this._activeTexture : GetTexturePool().getTexture(avatarCanvas.width, avatarCanvas.height);

                if(!texture) return null;

                try
                {
                    GetRenderer().render({ target: texture, container, clear: true });
                }
                catch (error)
                {
                    if(!reuse) GetTexturePool().putTexture(texture);

                    throw error;
                }

                if(!reuse) this.releaseActiveTexture();

                this._activeTexture = texture;
                texture.source.hitMapDirty = true;
            }

            this._changes = false;
            this._activeSetType = setType;

            return this._activeTexture;
        }
        finally
        {
            for(const child of container.children) child.removeChildren();

            container.destroy({ children: true });
            this.disposeTransientBodyParts();
        }
    }

    public processAsImageUrl(setType: string, scale: number = 1): string
    {
        const texture = this.processAsTexture(setType, false);
        const canvas = GetRenderer().texture.generateCanvas(texture);

        const url = canvas.toDataURL('image/png');

        canvas.width = 0;
        canvas.height = 0;

        return url;
    }

    public processAsCroppedImageUrl(setType: string, trimTransparentPixels: boolean = false): string
    {
        if(!this._mainAction) return null;

        if(!this._actionsSorted) this.endActionAppends();

        const avatarCanvas = this._structure.getCanvas(this._scale, this._mainAction.definition.geometryType);

        if(!avatarCanvas) return null;

        const container = this.buildAvatarContainer(avatarCanvas, setType);

        if(!container) return null;

        try
        {
            const canvas = TextureUtils.generateCanvas({ target: container, resolution: 1 });

            if(trimTransparentPixels) AvatarImage.cropCanvasToOpaqueBounds(canvas);

            const url = canvas.toDataURL('image/png');

            canvas.width = 0;
            canvas.height = 0;

            return url;
        }
        finally
        {
            for(const child of container.children)
            {
                child.removeChildren();
            }

            container.destroy({ children: true });
            this.disposeTransientBodyParts();
        }
    }

    private static cropCanvasToOpaqueBounds(canvas: ICanvas): void
    {
        if(!canvas || canvas.width <= 0 || canvas.height <= 0) return;

        try
        {
            const context = canvas.getContext('2d');

            if(!context) return;

            const sourceWidth = canvas.width;
            const sourceHeight = canvas.height;
            const pixels = context.getImageData(0, 0, sourceWidth, sourceHeight).data;
            const alphaThreshold = 8;
            let minX = sourceWidth;
            let minY = sourceHeight;
            let maxX = -1;
            let maxY = -1;

            for(let y = 0; y < sourceHeight; y++)
            {
                const rowStart = y * sourceWidth * 4;

                for(let x = 0; x < sourceWidth; x++)
                {
                    if(pixels[rowStart + (x * 4) + 3] <= alphaThreshold) continue;

                    if(x < minX) minX = x;
                    if(x > maxX) maxX = x;
                    if(y < minY) minY = y;
                    if(y > maxY) maxY = y;
                }
            }

            if(maxX < minX || maxY < minY) return;

            const width = (maxX - minX) + 1;
            const height = (maxY - minY) + 1;

            if(width === sourceWidth && height === sourceHeight) return;

            const croppedImage = context.getImageData(minX, minY, width, height);

            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d')?.putImageData(croppedImage, 0, 0);
        }
        catch
        {
            // Keep the renderer-generated canvas if pixel inspection is unavailable.
        }
    }

    public processAsContainer(setType: string): Container
    {
        if(!this._mainAction) return null;

        if(!this._actionsSorted) this.endActionAppends();

        const avatarCanvas = this._structure.getCanvas(this._scale, this._mainAction.definition.geometryType);

        if(!avatarCanvas) return null;

        return this.buildAvatarContainer(avatarCanvas, setType);
    }

    // TODO this needs to be added still
    public applyPalette(texture: RenderTexture, reds: number[] = [], greens: number[] = [], blues: number[] = []): RenderTexture
    {
        const textureCanvas = TextureUtils.generateCanvas(texture);
        const textureCtx = textureCanvas.getContext('2d');
        const textureImageData = textureCtx.getImageData(0, 0, textureCanvas.width, textureCanvas.height);
        const pixelData = textureImageData.data;

        for(let pixelIndex = 0; pixelIndex < pixelData.length; pixelIndex += 4)
        {
            if(reds.length == 256)
            {
                let paletteColor = reds[pixelData[pixelIndex]];
                if(paletteColor === undefined) paletteColor = 0;

                pixelData[pixelIndex] = ((paletteColor >> 16) & 0xFF);
                pixelData[pixelIndex + 1] = ((paletteColor >> 8) & 0xFF);
                pixelData[pixelIndex + 2] = (paletteColor & 0xFF);
            }

            if(greens.length == 256)
            {
                let paletteColor = greens[pixelData[pixelIndex + 1]];
                if(paletteColor === undefined) paletteColor = 0;

                pixelData[pixelIndex] = ((paletteColor >> 16) & 0xFF);
                pixelData[pixelIndex + 1] = ((paletteColor >> 8) & 0xFF);
                pixelData[pixelIndex + 2] = (paletteColor & 0xFF);
            }
            if(blues.length == 256)
            {
                let paletteColor = blues[pixelData[pixelIndex + 2]];
                if(paletteColor === undefined) paletteColor = 0;

                pixelData[pixelIndex] = ((paletteColor >> 16) & 0xFF);
                pixelData[pixelIndex + 1] = ((paletteColor >> 8) & 0xFF);
                pixelData[pixelIndex + 2] = (paletteColor & 0xFF);
            }
        }

        textureCtx.putImageData(textureImageData, 0, 0);

        const newTexture = new Sprite(Texture.from(textureCanvas, true));

        TextureUtils.writeToTexture(newTexture, texture, true);

        newTexture.destroy({ texture: true, textureSource: true });

        return texture;
    }


    public getAsset(name: string): IGraphicAsset
    {
        return this._assets.getAsset(name);
    }

    public getDirection(): number
    {
        return this._mainDirection;
    }

    public getDirectionOffset(): number
    {
        return this._directionOffset;
    }

    public initActionAppends(): void
    {
        this._actions = [];
        this._actionsSorted = false;
        this._currentActionsString = '';
    }

    public endActionAppends(): void
    {
        if(!this.sortActions()) return;

        for(const action of this._sortedActions)
        {
            if(action.actionType === AvatarAction.EFFECT)
            {
                if(!this._effectManager.isAvatarEffectReady(parseInt(action.actionParameter))) this._effectManager.downloadAvatarEffect(parseInt(action.actionParameter), this);
            }
        }

        this.resetActions();
        this.setActionsToParts();
    }

    public appendAction(actionType: string, ...actionParameters: any[]): boolean
    {
        let actionParameter = '';

        this._actionsSorted = false;

        if(actionParameters && (actionParameters.length > 0)) actionParameter = actionParameters[0];

        if((actionParameter !== undefined) && (actionParameter !== null)) actionParameter = actionParameter.toString();

        switch(actionType)
        {
            case AvatarAction.POSTURE:
                switch(actionParameter)
                {
                    case AvatarAction.POSTURE_LAY:
                    case AvatarAction.POSTURE_WALK:
                    case AvatarAction.POSTURE_STAND:
                    case AvatarAction.POSTURE_SWIM:
                    case AvatarAction.POSTURE_FLOAT:
                    case AvatarAction.POSTURE_SIT:
                    case AvatarAction.SNOWWAR_RUN:
                    case AvatarAction.SNOWWAR_DIE_FRONT:
                    case AvatarAction.SNOWWAR_DIE_BACK:
                    case AvatarAction.SNOWWAR_PICK:
                    case AvatarAction.SNOWWAR_THROW:
                        if((actionParameter === AvatarAction.POSTURE_LAY) || (actionParameter === AvatarAction.POSTURE_LAY) || (actionParameter === AvatarAction.POSTURE_LAY))
                        {
                            if(actionParameter === AvatarAction.POSTURE_LAY)
                            {
                                if(this._mainDirection == 0)
                                {
                                    this.setDirection(AvatarSetType.FULL, 4);
                                }
                                else
                                {
                                    this.setDirection(AvatarSetType.FULL, 2);
                                }
                            }
                        }

                        // The SnowWar uniform only draws the fall in even directions and aliases each odd one onto
                        // the next (1 -> 2, 3 -> 4, 5 -> 6, 7 -> 0). The head has no fall art and is hidden by
                        // per-direction offsets that exist only for even directions, so at odd directions the
                        // upright head floated above the lying body: the whole figure takes the aliased direction.
                        if(((actionParameter === AvatarAction.SNOWWAR_DIE_FRONT) || (actionParameter === AvatarAction.SNOWWAR_DIE_BACK)) && (this._mainDirection % 2))
                        {
                            this.setDirection(AvatarSetType.FULL, ((this._mainDirection + 1) % 8));
                        }

                        this.addActionData(actionParameter);
                        break;
                }
                break;
            case AvatarAction.GESTURE:
                switch(actionParameter)
                {
                    case AvatarAction.GESTURE_AGGRAVATED:
                    case AvatarAction.GESTURE_SAD:
                    case AvatarAction.GESTURE_SMILE:
                    case AvatarAction.GESTURE_SURPRISED:
                        this.addActionData(actionParameter);
                        break;
                }
                break;
            case AvatarAction.EFFECT:
            case AvatarAction.DANCE:
            case AvatarAction.TALK:
            case AvatarAction.EXPRESSION_WAVE:
            case AvatarAction.SLEEP:
            case AvatarAction.BLINK:
            case AvatarAction.SIGN:
            case AvatarAction.EXPRESSION_RESPECT:
            case AvatarAction.EXPRESSION_BLOW_A_KISS:
            case AvatarAction.EXPRESSION_LAUGH:
            case AvatarAction.EXPRESSION_CRY:
            case AvatarAction.EXPRESSION_IDLE:
            case AvatarAction.EXPRESSION_SNOWBOARD_OLLIE:
            case AvatarAction.EXPRESSION_SNOWBORD_360:
            case AvatarAction.EXPRESSION_RIDE_JUMP:
                if(actionParameter === AvatarAction.EFFECT)
                {
                    if((((((actionParameter === '33') || (actionParameter === '34')) || (actionParameter === '35')) || (actionParameter === '36')) || (actionParameter === '38')) || (actionParameter === '39'))
                    {
                        //
                    }
                }

                this.addActionData(actionType, actionParameter);
                break;
            case AvatarAction.CARRY_OBJECT:
            case AvatarAction.USE_OBJECT: {
                const actionDefinition = this._structure.getActionDefinitionWithState(actionType);
                if(actionDefinition) actionParameter = actionDefinition.getParameterValue(actionParameter);
                this.addActionData(actionType, actionParameter);
                break;
            }
        }

        return true;
    }

    protected addActionData(actionType: string, actionParameter: string = ''): void
    {
        if(!this._actions) this._actions = [];

        const actionExists = this._actions.some(action =>
            action.actionType === actionType && action.actionParameter === actionParameter
        );

        if(actionExists) return;

        let startFrame = this._frameCounter;

        // The same effect again keeps the frame it started on.
        if((actionType === AvatarAction.EFFECT) && (actionParameter === this._effectIdInUse.toString()) && (this._effectAnimationId !== null)) startFrame = this._effectAnimationStartFrame;

        this._actions.push(new ActiveActionData(actionType, actionParameter, startFrame));
    }

    public isAnimating(): boolean
    {
        return (this._isAnimating) || (this._animationFrameCount > 1) || (!!this._cache && this._cache.hasAnimatedContent);
    }

    private resetActions(): boolean
    {
        this._animationHasResetOnToggle = false;
        this._isAnimating = false;
        this._sprites = [];
        this._avatarSpriteData = null;
        this._directionAnimationId = null;
        this._directionAnimationStartFrame = 0;
        this._directionAnimationActionName = null;
        this.setDirectionOffset(0);
        this._effectAnimationId = null;
        this._effectAnimationStartFrame = 0;
        this._structure.removeDynamicItems(this);
        this._mainAction = this._defaultAction;
        this._mainAction.definition = this._defaultAction.definition;
        this.resetBodyPartCache(this._defaultAction);
        return true;
    }

    private isHeadTurnPreventedByAction(): boolean
    {
        if(!this._sortedActions) return false;

        for(const action of this._sortedActions)
        {
            const actionDefinition = this._structure.getActionDefinitionWithState(action.actionType);

            if(actionDefinition != null && actionDefinition.getPreventHeadTurn(action.actionParameter)) return true;
        }

        return false;
    }

    private sortActions(): boolean
    {
        let hasChanges = false;
        let hasEffectAction = false;
        let effectChanged = false;

        this._currentActionsString = '';
        this._sortedActions = this._structure.sortActions(this._actions);
        this._animationFrameCount = this._structure.maxFrames(this._sortedActions);

        if(!this._sortedActions)
        {
            this._canvasOffsets = [0, 0, 0];

            if(this._lastActionsString !== '')
            {
                hasChanges = true;

                this._lastActionsString = '';
            }
        }
        else
        {
            this._canvasOffsets = this._structure.getCanvasOffsets(this._sortedActions, this._scale, this._mainDirection);

            for(const action of this._sortedActions)
            {
                this._currentActionsString += action.actionType + action.actionParameter;

                if(action.actionType === AvatarAction.EFFECT)
                {
                    const effectId = parseInt(action.actionParameter);

                    if(this._effectIdInUse !== effectId) effectChanged = true;

                    this._effectIdInUse = effectId;

                    hasEffectAction = true;
                }
            }

            if(!hasEffectAction)
            {
                if(this._effectIdInUse > -1) effectChanged = true;

                this._effectIdInUse = -1;
            }

            if(effectChanged) this._cache.disposeInactiveActions(0);

            if(this._lastActionsString != this._currentActionsString)
            {
                hasChanges = true;

                this._lastActionsString = this._currentActionsString;
            }
        }

        this._actionsSorted = true;

        return hasChanges;
    }

    private setActionsToParts(): void
    {
        if(!this._sortedActions) return;

        const currentTime = GetTickerTime();
        const actionTypes: string[] = [];

        for(const action of this._sortedActions) actionTypes.push(action.actionType);

        for(const action of this._sortedActions)
        {
            if(action && action.definition && action.definition.isAnimation)
            {
                const animation = this._structure.getAnimation(`${action.definition.state}.${action.actionParameter}`);

                if(animation && animation.hasOverriddenActions())
                {
                    const overriddenActionNames = animation.overriddenActionNames();

                    if(overriddenActionNames)
                    {
                        for(const overriddenActionName of overriddenActionNames)
                        {
                            if(actionTypes.includes(overriddenActionName)) action.overridingAction = animation.overridingAction(overriddenActionName);
                        }
                    }
                }

                if(animation && animation.resetOnToggle) this._animationHasResetOnToggle = true;
            }
        }

        for(const action of this._sortedActions)
        {
            if(action && action.definition)
            {
                if(action.definition.isAnimation && action.actionParameter === '') action.actionParameter = '1';

                this.setActionToParts(action, currentTime);

                if(action.definition.isAnimation)
                {
                    this._isAnimating = action.definition.isAnimated(action.actionParameter);

                    const animation = this._structure.getAnimation(`${action.definition.state}.${action.actionParameter}`);

                    if(animation)
                    {
                        if(action.actionType === AvatarAction.EFFECT)
                        {
                            this._effectAnimationId = animation.id;
                            this._effectAnimationStartFrame = action.startFrame;
                        }

                        this._sprites = [...this._sprites, ...animation.spriteData];

                        if(animation.hasDirectionData())
                        {
                            this._directionAnimationId = animation.id;
                            this._directionAnimationStartFrame = action.startFrame;
                            this._directionAnimationActionName = action.overridingAction;
                        }

                        if(animation.hasAvatarData()) this._avatarSpriteData = animation.avatarData;

                        if(!this._isAnimating && (animation.spriteData?.length > 0 || animation.hasAvatarData()))
                        {
                            this._isAnimating = true;
                        }
                    }
                }
            }
        }

        this.updateDirectionOffset();
    }

    private setActionToParts(action: IActiveActionData, currentTime: number): void
    {
        if(!action || !action.definition || action.definition.assetPartDefinition === '') return;

        if(action.definition.isMain)
        {
            this._mainAction = action;
            this._cache.setGeometryType(action.definition.geometryType);
        }

        this._cache.setAction(action, currentTime);

        this._changes = true;
    }

    private resetBodyPartCache(action: IActiveActionData): void
    {
        if(!action || action.definition.assetPartDefinition === '') return;

        if(action.definition.isMain)
        {
            this._mainAction = action;
            this._cache.setGeometryType(action.definition.geometryType);
        }

        this._cache.resetBodyPartCache(action);

        this._changes = true;
    }

    private releaseActiveTexture(): void
    {
        if(this._sharedFrame) this._frameTextures?.release(this._sharedFrame);
        else if(this._activeTexture) GetTexturePool().putTexture(this._activeTexture);

        this._sharedFrame = null;
        this._activeTexture = null;
    }

    private disposeTransientBodyParts(): void
    {
        if(!this._transientBodyParts.length) return;

        for(const part of this._transientBodyParts) part && part.dispose();

        this._transientBodyParts.length = 0;
    }

    private getPaletteMapFilter(spriteData: IAvatarDataContainer): PaletteMapFilter
    {
        // Rebuilt only when the palette behind it actually changes. It used to be constructed on
        // every render, and each instance allocates a GPU LUT texture that nothing ever released.
        if(this._paletteMapFilter && (this._paletteMapFilterSource === spriteData)) return this._paletteMapFilter;

        if(this._paletteMapFilter) this._paletteMapFilter.destroy();

        this._paletteMapFilter = new PaletteMapFilter({
            palette: spriteData.reds,
            channel: PaletteMapFilter.CHANNEL_RED
        });

        this._paletteMapFilterSource = spriteData;

        return this._paletteMapFilter;
    }

    private disposeFilters(): void
    {
        if(this._grayscaleFilter)
        {
            this._grayscaleFilter.destroy();
            this._grayscaleFilter = null;
            this._grayscaleFilterChannel = null;
        }

        if(this._paletteMapFilter)
        {
            this._paletteMapFilter.destroy();
            this._paletteMapFilter = null;
            this._paletteMapFilterSource = null;
        }
    }

    private convertToGrayscale(container: Container, channel: string = 'CHANNELS_EQUAL'): Container
    {
        const filter = this.getGrayscaleFilter(channel);

        if(container.filters === undefined || container.filters === null) container.filters = [ filter ];
        else container.filters = [ ...(container.filters), filter ];

        return container;
    }

    private getGrayscaleFilter(channel: string): ColorMatrixFilter
    {
        // Same story as the palette filter: the matrix only depends on the channel, so one filter
        // per AvatarImage is enough. Pixi never destroys the filters on a container it destroys.
        if(this._grayscaleFilter && (this._grayscaleFilterChannel === channel)) return this._grayscaleFilter;

        if(this._grayscaleFilter) this._grayscaleFilter.destroy();

        let redWeight = 0.33;
        let greenWeight = 0.33;
        let blueWeight = 0.33;

        switch(channel)
        {
            case AvatarImage.CHANNELS_UNIQUE:
                redWeight = 0.3;
                greenWeight = 0.59;
                blueWeight = 0.11;
                break;
            case AvatarImage.CHANNELS_RED:
                redWeight = 1;
                greenWeight = 0;
                blueWeight = 0;
                break;
            case AvatarImage.CHANNELS_GREEN:
                redWeight = 0;
                greenWeight = 1;
                blueWeight = 0;
                break;
            case AvatarImage.CHANNELS_BLUE:
                redWeight = 0;
                greenWeight = 0;
                blueWeight = 1;
                break;
            case AvatarImage.CHANNELS_DESATURATED:
                redWeight = 0.3086;
                greenWeight = 0.6094;
                blueWeight = 0.082;
                break;
        }

        const filter = new ColorMatrixFilter();

        filter.matrix = [
            redWeight, greenWeight, blueWeight, 0, 0, // Red channel
            redWeight, greenWeight, blueWeight, 0, 0, // Green channel
            redWeight, greenWeight, blueWeight, 0, 0, // Blue channel
            0, 0, 0, 1, 0 // Alpha channel
        ];

        this._grayscaleFilter = filter;
        this._grayscaleFilterChannel = channel;

        return filter;
    }

    public isPlaceholder(): boolean
    {
        return false;
    }

    public get animationHasResetOnToggle(): boolean
    {
        return this._animationHasResetOnToggle;
    }

    public resetEffect(effect: number): void
    {
        if(effect === this._effectIdInUse)
        {
            this.resetActions();
            this.setActionsToParts();

            this._animationHasResetOnToggle = true;
            this._changes = true;

            if(this._effectListener) this._effectListener.resetEffect(effect);
        }
    }
}
