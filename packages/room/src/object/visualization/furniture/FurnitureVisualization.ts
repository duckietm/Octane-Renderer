import { getHalfSizeTexture, halfSizeOffset, halfSizePadding, isPixelArtTexture } from '@octane/assets';
import { AlphaTolerance, IGraphicAsset, IObjectVisualizationData, IRoomGeometry, IRoomObjectSprite, IRoomObjectVariableFxEntry, IVector3D, RoomObjectVariable, RoomObjectVisualizationType } from '@octane/api';
import { ChooserSelectionFilter, OctaneLogger, Vector3d, WiredFilter } from '@octane/utils';
import { BLEND_MODES, Filter, Texture } from 'pixi.js';
import { RoomObjectSprite } from '../RoomObjectSprite';
import { RoomObjectSpriteVisualization } from '../RoomObjectSpriteVisualization';
import { IWindowReflectionUnitLayer, RoomWindowReflectionState } from '../RoomWindowReflectionState';
import { ColorData, LayerData } from '../data';
import { FurnitureVisualizationData } from './FurnitureVisualizationData';
import { usesWiredHighlightCompositeSilhouette, WiredHighlightFilterCache } from '../WiredHighlightFilters';
import { WiredHighlightSilhouette } from '../WiredHighlightSilhouette';
import { VariableFxStack } from '../variablefx/VariableFxStack';
import { composeFurnitureAlphaMultiplier, furnitureAlphaTolerance } from './WiredOpacityVisualizationPolicy';

export class FurnitureVisualization extends RoomObjectSpriteVisualization
{
    protected static DEPTH_MULTIPLIER: number = Math.sqrt(0.5);
    /** AIR: the fx stack of a furni starts 4 px above its topmost sprite. */
    public static VARIABLE_FX_STACK_GAP: number = 4;

    public static TYPE: string = RoomObjectVisualizationType.FURNITURE_STATIC;

    protected _data: FurnitureVisualizationData;

    protected _type: string;
    protected _direction: number;
    protected _lastCameraAngle: number;
    protected _selectedColor: number;
    protected _furnitureLift: number;
    protected _alphaMultiplier: number;
    protected _alphaChanged: boolean;
    protected _clickUrl: string;
    protected _clickHandling: boolean;

    protected _cacheDirection: number;
    protected _cacheScale: number;
    protected _cacheSize: number;

    protected _layerCount: number;
    protected _shadowLayerIndex: number;
    protected _updatedLayers: boolean[];
    protected _assetNames: string[];
    protected _spriteTags: string[];
    protected _spriteBlendModes: BLEND_MODES[];
    protected _spriteAlphas: number[];
    protected _spriteColors: number[];
    protected _spriteMouseCaptures: boolean[];
    protected _spriteXOffsets: number[];
    protected _spriteYOffsets: number[];
    protected _spriteZOffsets: number[];
    protected _filters: Filter[] = [];

    private _animationNumber: number;
    private _windowReflectionPushed: boolean = false;
    private _windowReflectionLocation: Vector3d = new Vector3d();
    private _windowReflectionCenter: Vector3d = new Vector3d();
    private _lookThrough: boolean;
    private _needsLookThroughUpdate: boolean;
    private _wiredClickThrough: boolean;
    private _hideInvisibleLayers: boolean;
    private _wiredHighlight: WiredHighlightFilterCache = new WiredHighlightFilterCache();
    private _wiredHighlightSilhouette: WiredHighlightSilhouette = null;
    private _extraSprites: IRoomObjectSprite[] = null;
    private _extraSpritesBase: IRoomObjectSprite[] = null;
    private _extraSpritesLength: number = -1;
    private _extraSpritesFx: boolean = false;
    private _extraSpritesGlow: boolean = false;
    private _highlightBaseSource: Filter[] = null;
    private _highlightSource: Filter[] = null;
    private _highlightCombined: Filter[] = null;
    private _variableFxStack: VariableFxStack = null;
    private _variableFxSprite: RoomObjectSprite = null;
    private _variableFxSource: IRoomObjectVariableFxEntry[] = null;

    constructor()
    {
        super();

        this._data = null;

        this._type = null;
        this._direction = 0;
        this._lastCameraAngle = NaN;
        this._selectedColor = 0;
        this._furnitureLift = 0;
        this._alphaMultiplier = 1;
        this._alphaChanged = false;
        this._clickUrl = null;
        this._clickHandling = false;

        this._cacheDirection = -1;
        this._cacheScale = 0;
        this._cacheSize = -1;

        this._layerCount = 0;
        this._shadowLayerIndex = -1;
        this._updatedLayers = [];
        this._assetNames = [];
        this._spriteTags = [];
        this._spriteBlendModes = [];
        this._spriteAlphas = [];
        this._spriteColors = [];
        this._spriteMouseCaptures = [];
        this._spriteXOffsets = [];
        this._spriteYOffsets = [];
        this._spriteZOffsets = [];

        this._animationNumber = 0;
        this._lookThrough = false;
        this._wiredClickThrough = false;
        this._hideInvisibleLayers = false;
    }

    public initialize(data: IObjectVisualizationData): boolean
    {
        this.reset();

        if(!(data instanceof FurnitureVisualizationData)) return false;

        this._type = data.type;
        this._data = data;

        return true;
    }

    public dispose(): void
    {
        if(this._windowReflectionPushed && this.object)
        {
            RoomWindowReflectionState.removeUnit(this.object.instanceId, this.object.model?.getValue<string>(RoomObjectVariable.OBJECT_ROOM_ID));

            this._windowReflectionPushed = false;
        }

        this.disposeVariableFx();

        this._wiredHighlightSilhouette?.dispose();
        this._wiredHighlightSilhouette = null;
        this._extraSprites = null;
        this._extraSpritesBase = null;

        super.dispose();

        this._data = null;
        this._updatedLayers = null;
        this._assetNames = null;
        this._spriteTags = null;
        this._spriteBlendModes = null;
        this._spriteAlphas = null;
        this._spriteColors = null;
        this._spriteMouseCaptures = null;
        this._spriteXOffsets = null;
        this._spriteYOffsets = null;
        this._spriteZOffsets = null;
        this._filters = [];
    }

    protected reset(): void
    {
        super.reset();

        this._wiredHighlightSilhouette?.clear(true);

        this.setDirection(-1);

        this._data = null;
        this._updatedLayers = [];
        this._assetNames = [];
        this._spriteTags = [];
        this._spriteBlendModes = [];
        this._spriteAlphas = [];
        this._spriteColors = [];
        this._spriteMouseCaptures = [];
        this._spriteXOffsets = [];
        this._spriteYOffsets = [];
        this._spriteZOffsets = [];

        this.createSprites(0);
    }

    protected resetLayers(scale: number, direction: number): void
    {
        if((this._cacheDirection === direction) && (this._cacheScale === scale)) return;

        this._updatedLayers = [];
        this._assetNames = [];
        this._spriteTags = [];
        this._spriteBlendModes = [];
        this._spriteAlphas = [];
        this._spriteColors = [];
        this._spriteMouseCaptures = [];
        this._spriteXOffsets = [];
        this._spriteYOffsets = [];
        this._spriteZOffsets = [];

        this._cacheDirection = direction;
        this._cacheScale = scale;
        this._cacheSize = this.getValidSize(scale);

        if(typeof window !== 'undefined' && (window as unknown as { OctaneFurniSizeDebug?: boolean }).OctaneFurniSizeDebug)
        {
            const note = scale === 32 ? (this._cacheSize === 32 ? ' ✓ size-32' : ' fallback -> size-' + this._cacheSize) : '';
            OctaneLogger.log(`[FurniSize] ${this._type}: geometry ${scale} -> sprite size ${this._cacheSize}${note}`);
        }

        this.setLayerCount(((this._data && this._data.getLayerCount(scale)) || 0) + this.getAdditionalLayerCount());
    }

    public update(geometry: IRoomGeometry, time: number, update: boolean, skipUpdate: boolean): void
    {
        if(!geometry) return;

        const scale = geometry.scale;
        let updateSprites = false;

        if(this.updateObject(scale, geometry.direction.x)) updateSprites = true;

        if(this.updateModel(scale)) updateSprites = true;

        if(this._needsLookThroughUpdate)
        {
            updateSprites = true;
            this._needsLookThroughUpdate = false;
        }

        let number = 0;

        if(skipUpdate)
        {
            this._animationNumber = (this._animationNumber | this.updateAnimation(scale));
        }
        else
        {
            number = this.updateAnimation(scale) | this._animationNumber;

            this._animationNumber = 0;
        }

        if(updateSprites || (number !== 0))
        {
            this.updateSprites(scale, updateSprites, number);

            this._scale = scale;

            this.updateSpriteCounter++;

            this.updateWindowReflectionSource();
        }
        else if(this._windowReflectionPushed)
        {
            const location = this.object?.getLocation();

            if(location && ((location.x !== this._windowReflectionLocation.x) || (location.y !== this._windowReflectionLocation.y) || (location.z !== this._windowReflectionLocation.z)))
            {
                this.updateWindowReflectionSource();
            }
        }

        if(this.updateWiredHighlightSilhouette()) this.updateSpriteCounter++;

        if(this.updateVariableFx()) this.updateSpriteCounter++;
    }

    /**
     * The furni's sprites, then its wired highlight glow and its wired variable fx stack while they show (AIR's
     * extra sprites).
     */
    public get sprites(): IRoomObjectSprite[]
    {
        const sprites = super.sprites;
        const fxSprite = this._variableFxSprite;
        const glowSprite = this._wiredHighlightSilhouette?.sprite;
        const showFx = !!fxSprite && fxSprite.visible && !!fxSprite.texture;
        const showGlow = !!glowSprite && glowSprite.visible && !!glowSprite.texture;

        if(!sprites || (!showFx && !showGlow)) return sprites;

        if((this._extraSpritesBase !== sprites) || (this._extraSpritesFx !== showFx) || (this._extraSpritesGlow !== showGlow) || (this._extraSpritesLength !== sprites.length))
        {
            this._extraSpritesBase = sprites;
            this._extraSpritesFx = showFx;
            this._extraSpritesGlow = showGlow;
            this._extraSpritesLength = sprites.length;
            this._extraSprites = [ ...sprites, ...(showGlow ? [ glowSprite ] : []), ...(showFx ? [ fxSprite ] : []) ];
        }

        return this._extraSprites;
    }

    /**
     * AIR's composite highlight: outline, soft glow and neon aura are drawn once behind the whole furni (its layers
     * but the shadow), so the furni stays visible on top. True when the glow sprite changed.
     */
    private updateWiredHighlightSilhouette(): boolean
    {
        const filters = this._wiredHighlight.filters;

        if(!filters || !usesWiredHighlightCompositeSilhouette(this._wiredHighlight.type))
        {
            if(!this._wiredHighlightSilhouette) return false;

            this._wiredHighlightSilhouette.dispose();
            this._wiredHighlightSilhouette = null;

            return true;
        }

        if(!this._wiredHighlightSilhouette) this._wiredHighlightSilhouette = new WiredHighlightSilhouette();

        const layers = super.sprites || [];
        const sources = layers.filter((sprite, layerId) => layerId !== this._shadowLayerIndex);
        const alpha = 255 * Math.max(0, Math.min(1, (this._alphaMultiplier ?? 1) * (this._lookThrough ? 0.2 : 1)));

        return this._wiredHighlightSilhouette.update(sources, filters, alpha);
    }

    /**
     * Draws the wired variable fx the client set on the model, AIR's way: one sprite in front of the
     * furni, centred over its drawn layers, its bottom 4 px above the topmost one. True when the fx
     * sprite changed.
     */
    private updateVariableFx(): boolean
    {
        const model = this.object?.model;
        const entries = (model ? model.getValue<IRoomObjectVariableFxEntry[]>(RoomObjectVariable.VARIABLE_FX_STACK) : null);

        if(!this._variableFxStack)
        {
            if(!entries || !entries.length) return false;

            this._variableFxStack = new VariableFxStack();
            this._variableFxSprite = new RoomObjectSprite();
            this._variableFxSprite.visible = false;
        }

        const now = Date.now();

        if(entries !== this._variableFxSource)
        {
            this._variableFxSource = entries;

            this._variableFxStack.setEntries((entries ?? []), now);
        }

        const sprite = this._variableFxSprite;
        const anchor = this.getVariableFxAnchor();

        if(!anchor)
        {
            if(!sprite.visible) return false;

            sprite.visible = false;

            return true;
        }

        const changed = this._variableFxStack.apply(sprite, anchor.x, anchor.y, now);

        // Everything faded out and nothing new arrived: let the stack go.
        if(this._variableFxStack.isEmpty && (!entries || !entries.length))
        {
            this.disposeVariableFx();

            return true;
        }

        return changed;
    }

    /** Centre of the drawn layers and the stack bottom, relative to the furni position; null while nothing draws. */
    private getVariableFxAnchor(): { x: number, y: number }
    {
        const totalSprites = this.totalSprites;
        let found = false;
        let minX = 0;
        let maxX = 0;
        let minY = 0;

        for(let index = 0; index < totalSprites; index++)
        {
            const sprite = this.getSprite(index);

            if(!sprite || !sprite.visible || !sprite.texture || (sprite.alpha <= 0) || (sprite.width <= 0) || (sprite.height <= 0)) continue;

            const left = Math.trunc(sprite.flipH ? (sprite.offsetX - sprite.width) : sprite.offsetX);
            const right = Math.trunc(left + sprite.width);
            const top = Math.trunc(sprite.flipV ? (sprite.offsetY - sprite.height) : sprite.offsetY);

            if(!found)
            {
                minX = left;
                maxX = right;
                minY = top;
                found = true;

                continue;
            }

            minX = Math.min(minX, left);
            maxX = Math.max(maxX, right);
            minY = Math.min(minY, top);
        }

        if(!found) return null;

        return { x: Math.round((minX + maxX) / 2), y: (minY - FurnitureVisualization.VARIABLE_FX_STACK_GAP) };
    }

    private disposeVariableFx(): void
    {
        this._variableFxStack?.dispose();
        this._variableFxSprite?.dispose();

        this._variableFxStack = null;
        this._variableFxSprite = null;
        this._variableFxSource = null;
    }

    protected get pushesWindowReflection(): boolean
    {
        return true;
    }

    private updateWindowReflectionSource(): void
    {
        if(!this.object || !this.pushesWindowReflection) return;

        if(this.object.model?.getValue<number>(RoomObjectVariable.FURNITURE_IS_WALL_ITEM) === 1) return;

        const location = this.object.getLocation();
        const roomId = this.object.model?.getValue<string>(RoomObjectVariable.OBJECT_ROOM_ID);

        let reflectionLocation: IVector3D = location;

        let sizeX = (this.object.model?.getValue<number>(RoomObjectVariable.FURNITURE_SIZE_X) || 1);
        let sizeY = (this.object.model?.getValue<number>(RoomObjectVariable.FURNITURE_SIZE_Y) || 1);

        if(sizeX < 1) sizeX = 1;
        if(sizeY < 1) sizeY = 1;

        if((sizeX > 1) || (sizeY > 1))
        {
            const angle = (((this.object.getDirection().x % 360) + 360) % 360);

            if((Math.round(angle / 90) % 2) === 1) [sizeX, sizeY] = [sizeY, sizeX];

            this._windowReflectionCenter.assign(location);
            this._windowReflectionCenter.x += ((sizeX - 1) / 2);
            this._windowReflectionCenter.y += ((sizeY - 1) / 2);

            reflectionLocation = this._windowReflectionCenter;
        }

        if(!RoomWindowReflectionState.hasZones || !RoomWindowReflectionState.isNearAnyZone(reflectionLocation, roomId, 1.1))
        {
            if(this._windowReflectionPushed)
            {
                RoomWindowReflectionState.removeUnit(this.object.instanceId, roomId);

                this._windowReflectionPushed = false;
            }

            return;
        }

        const reflectionDebug = (typeof window !== 'undefined' && (window as unknown as { OctaneReflectionDebug?: boolean }).OctaneReflectionDebug === true);

        const layers: IWindowReflectionUnitLayer[] = [];
        const sources: { name: string; layerId: number; alpha: number }[] = [];
        const totalSprites = this.totalSprites;

        for(let i = 0; i < totalSprites; i++)
        {
            const sprite = this.getSprite(i);

            if(!sprite || !sprite.visible || !sprite.texture || (sprite.texture === Texture.EMPTY)) continue;

            if(sprite.blendMode && (sprite.blendMode !== 'normal')) continue;

            const flipH = !!sprite.flipH;
            const width = sprite.texture.width;
            const layerAlpha = (sprite.alpha / 255);

            layers.push({
                texture: sprite.texture,
                offsetX: (flipH ? (sprite.offsetX - width) : sprite.offsetX),
                offsetY: sprite.offsetY,
                alpha: layerAlpha,
                flipH
            });

            sources.push({ name: sprite.name, layerId: i, alpha: layerAlpha });
        }

        if(!layers.length)
        {
            if(this._windowReflectionPushed)
            {
                RoomWindowReflectionState.removeUnit(this.object.instanceId, roomId);

                this._windowReflectionPushed = false;
            }

            return;
        }

        const worldDirection = this.object.getDirection().x;
        const layersByDirection = new Map<number, IWindowReflectionUnitLayer[]>();

        if(this._data && (this._scale > 0))
        {
            const normals = RoomWindowReflectionState.getZoneNormalsNear(reflectionLocation, roomId, 1.1);
            const cameraAngle = (Number.isFinite(this._lastCameraAngle) ? this._lastCameraAngle : -135); // engine default camera

            for(const normal of normals)
            {
                const mirrorDegrees = RoomWindowReflectionState.reflectDirection(worldDirection, normal.x, normal.y);

                if(layersByDirection.has(mirrorDegrees)) continue;

                const offsetDirection = ((((mirrorDegrees - (cameraAngle + 135)) % 360) + 360) % 360);
                const exactDirection = (((Math.round(offsetDirection / 45) % 8) + 8) % 8);

                let mirrorDirection = exactDirection;
                let mirrorLayers = ((exactDirection !== this._direction) ? this.buildMirrorLayers(sources, exactDirection) : null);

                if(!mirrorLayers && (exactDirection !== this._direction))
                {
                    mirrorDirection = this._data.getValidDirection(this._scale, offsetDirection);

                    if(mirrorDirection !== this._direction) mirrorLayers = this.buildMirrorLayers(sources, mirrorDirection);
                }

                if(mirrorLayers) layersByDirection.set(mirrorDegrees, mirrorLayers);

                if(reflectionDebug) OctaneLogger.log(`[Reflection] unit ${this.object.instanceId}: world ${worldDirection}° mirrored across (${normal.x.toFixed(2)}, ${normal.y.toFixed(2)}) -> ${mirrorDegrees}° (sprite dir ${mirrorDirection}, exact ${exactDirection}, live ${this._direction}, ${mirrorLayers ? mirrorLayers.length + ' layers' : 'live layers'})`);
            }
        }

        RoomWindowReflectionState.setUnit(this.object.instanceId, layers, layersByDirection, worldDirection, reflectionLocation, location, roomId, sizeX, sizeY);

        this._windowReflectionPushed = true;
        this._windowReflectionLocation.assign(location);
    }

    private buildMirrorLayers(sources: { name: string; layerId: number; alpha: number }[], direction: number): IWindowReflectionUnitLayer[]
    {
        if(!this._data) return null;

        const result: IWindowReflectionUnitLayer[] = [];
        const sizeScale = (((this._cacheSize >= 32) && (this._scale > 0)) ? (this._scale / this._cacheSize) : 1);

        for(const source of sources)
        {
            const asset = this.getDirectionAsset(source.name, source.layerId, direction);

            if(!asset?.texture || asset.texture.destroyed) return null;

            const flipH = !!asset.flipH;
            const width = asset.texture.width;

            const offsetX = ((asset.offsetX + this._data.getLayerXOffset(this._scale, direction, source.layerId)) * sizeScale);
            const offsetY = ((asset.offsetY + this._data.getLayerYOffset(this._scale, direction, source.layerId)) * sizeScale);

            result.push({
                texture: asset.texture,
                offsetX: (flipH ? (offsetX - width) : offsetX),
                offsetY,
                alpha: source.alpha,
                flipH
            });
        }

        return (result.length ? result : null);
    }

    private getDirectionAsset(assetName: string, layerId: number, direction: number): IGraphicAsset
    {
        if(!assetName || (direction < 0)) return null;

        const parts = assetName.split('_');

        if(parts.length < 5) return null;

        if(isNaN(parseInt(parts[parts.length - 2]))) return null;

        parts[parts.length - 2] = direction.toString();

        let asset = this.getAsset(parts.join('_'), layerId);

        if(!asset)
        {
            parts[parts.length - 1] = '0';

            asset = this.getAsset(parts.join('_'), layerId);
        }

        return asset;
    }

    protected updateObject(scale: number, direction: number): boolean
    {
        if(!this.object) return false;

        if((this.updateObjectCounter === this.object.updateCounter) && (scale === this._scale) && (this._lastCameraAngle === direction)) return false;

        let offsetDirection = (this.object.getDirection().x - (direction + 135));

        offsetDirection = ((((offsetDirection) % 360) + 360) % 360);

        if(this._data)
        {
            const validDirection = this._data.getValidDirection(scale, offsetDirection);

            this.setDirection(validDirection);
        }

        this._lastCameraAngle = direction;
        this._scale = scale;

        this.updateObjectCounter = this.object.updateCounter;

        this.resetLayers(scale, this._direction);

        return true;
    }

    protected updateModel(scale: number): boolean
    {
        const model = this.object && this.object.model;

        if(!model) return false;

        if(this.updateModelCounter === model.updateCounter) return false;

        this._selectedColor = model.getValue<number>(RoomObjectVariable.FURNITURE_COLOR);
        this._clickUrl = model.getValue<string>(RoomObjectVariable.FURNITURE_AD_URL);
        this._clickHandling = ((this._clickUrl && (this._clickUrl !== '') && (this._clickUrl.indexOf('http') === 0)) || false);
        this._furnitureLift = (model.getValue<number>(RoomObjectVariable.FURNITURE_LIFT_AMOUNT) || 0);

        let alphaMultiplier = model.getValue<number>(RoomObjectVariable.FURNITURE_ALPHA_MULTIPLIER);
        const wiredOpacity = model.getValue<number>(RoomObjectVariable.FURNITURE_WIRED_OPACITY);
        const wiredTransparency = model.getValue<number>(RoomObjectVariable.FURNITURE_WIRED_TRANSPARENCY);
        const wiredVisibility = isNaN(wiredTransparency) ? 1 : (1 - (Math.max(0, Math.min(100, wiredTransparency)) / 100));
        const wiredClickThrough = (model.getValue<number>(RoomObjectVariable.FURNITURE_WIRED_CLICK_THROUGH) === 1);
        const hiddenByConfInvisControl = (model.getValue<number>(RoomObjectVariable.FURNITURE_CONF_INVIS_HIDDEN) === 1);
        const hiddenByAreaHideControl = (model.getValue<number>(RoomObjectVariable.FURNITURE_AREA_HIDE_HIDDEN) === 1);
        const hideInvisibleLayers = (model.getValue<number>(RoomObjectVariable.FURNITURE_INVISIBLE_LAYER) > 0);

        if(isNaN(alphaMultiplier)) alphaMultiplier = 1;
        alphaMultiplier = composeFurnitureAlphaMultiplier(alphaMultiplier, (isNaN(wiredOpacity) ? 1 : wiredOpacity) * wiredVisibility, hiddenByConfInvisControl || hiddenByAreaHideControl);

        if((this._alphaMultiplier !== alphaMultiplier) || (this._wiredClickThrough !== wiredClickThrough))
        {
            this._alphaMultiplier = alphaMultiplier;
            this._wiredClickThrough = wiredClickThrough;

            this._alphaChanged = true;
        }

        if(this._hideInvisibleLayers !== hideInvisibleLayers)
        {
            this._hideInvisibleLayers = hideInvisibleLayers;
            this._alphaChanged = true;
        }

        const highlightType = model.getValue<number>(RoomObjectVariable.FURNITURE_WIRED_HIGHLIGHT_TYPE);
        const highlightStrength = model.getValue<number>(RoomObjectVariable.FURNITURE_WIRED_HIGHLIGHT_STRENGTH);
        const highlightColor = model.getValue<number>(RoomObjectVariable.FURNITURE_WIRED_HIGHLIGHT_COLOR);

        // A changed highlight redraws the layers, like a changed alpha does.
        if(this._wiredHighlight.update(isNaN(highlightType) ? 0 : highlightType, highlightStrength, isNaN(highlightColor) ? 0xFFFFFF : highlightColor)) this._alphaChanged = true;

        this.updateModelCounter = model.updateCounter;

        return true;
    }

    protected updateSprites(scale: number, update: boolean, animation: number): void
    {
        if(this._layerCount !== this.totalSprites) this.createSprites(this._layerCount);

        if(update)
        {
            let layerId = (this.totalSprites - 1);

            while(layerId >= 0)
            {
                this.updateSprite(scale, layerId);

                layerId--;
            }
        }
        else
        {
            let layerId = 0;

            while(animation > 0)
            {
                if(animation) this.updateSprite(scale, layerId);

                layerId++;
                animation = (animation >> 1);
            }
        }

        this._alphaChanged = false;
    }

    /** Offsets in full-size pixels; with halfSize the sprite gets a half-size texture placed on whole pixels. */
    private setSpriteOffsets(sprite: IRoomObjectSprite, texture: Texture, halfSize: boolean, sizeScale: number, offsetX: number, offsetY: number): void
    {
        const half = (halfSize ? getHalfSizeTexture(texture, halfSizePadding(offsetX), halfSizePadding(offsetY)) : null);

        if(half)
        {
            sprite.texture = half;
            sprite.scale = 1;
            sprite.offsetX = halfSizeOffset(offsetX, sprite.flipH);
            sprite.offsetY = halfSizeOffset(offsetY, sprite.flipV);

            return;
        }

        sprite.offsetX = (offsetX * sizeScale);
        sprite.offsetY = (offsetY * sizeScale);
    }

    protected updateSprite(scale: number, layerId: number): void
    {
        const assetName = this.getSpriteAssetName(scale, layerId);
        const sprite = this.getSprite(layerId);

        if(assetName && sprite)
        {
            const assetData = this.getAsset(assetName, layerId);

            if(assetData)
            {
                sprite.visible = true;
                sprite.type = this._type;
                const texture = this.getTexture(scale, layerId, assetData);

                sprite.texture = texture;
                sprite.flipH = assetData.flipH;
                sprite.flipV = assetData.flipV;
                sprite.direction = this._direction;

                const sizeScale = ((this._cacheSize >= 32) && (scale > 0)) ? (scale / this._cacheSize) : 1;
                // No size 32 in the bundle: draw a real half-size sprite instead of scaling the 64 one.
                const halfSize = ((sizeScale === 0.5) && isPixelArtTexture(texture));

                sprite.scale = sizeScale;

                let relativeDepth = 0;

                if(layerId !== this._shadowLayerIndex)
                {
                    sprite.tag = this.getLayerTag(scale, this._direction, layerId);
                    sprite.alpha = this.getLayerAlpha(scale, this._direction, layerId);
                    sprite.color = this.getLayerColor(scale, layerId, this._selectedColor);
                    this.setSpriteOffsets(sprite, texture, halfSize, sizeScale,
                        (assetData.offsetX + this.getLayerXOffset(scale, this._direction, layerId)),
                        (assetData.offsetY + this.getLayerYOffset(scale, this._direction, layerId)));
                    sprite.blendMode = this.getLayerBlendMode(scale, this._direction, layerId);
                    sprite.alphaTolerance = furnitureAlphaTolerance(this.getLayerIgnoreMouse(scale, this._direction, layerId), this._wiredClickThrough);

                    if(this.shouldHideInvisibleLayer(sprite.tag))
                    {
                        sprite.alpha = 0;
                        sprite.alphaTolerance = AlphaTolerance.MATCH_NOTHING;
                    }

                    relativeDepth = this.getLayerZOffset(scale, this._direction, layerId);
                    relativeDepth = (relativeDepth - (layerId * 0.001));
                }
                else
                {
                    this.setSpriteOffsets(sprite, texture, halfSize, sizeScale,
                        assetData.offsetX,
                        (assetData.offsetY + this.getLayerYOffset(scale, this._direction, layerId)));
                    sprite.alpha = (48 * this._alphaMultiplier);

                    sprite.alphaTolerance = AlphaTolerance.MATCH_NOTHING;

                    relativeDepth = 1;
                }

                if(this._lookThrough) sprite.alpha *= 0.2;

                sprite.relativeDepth = (relativeDepth * FurnitureVisualization.DEPTH_MULTIPLIER);
                sprite.name = assetName;
                sprite.libraryAssetName = this.getLibraryAssetNameForSprite(assetData, sprite);
                sprite.posture = this.getPostureForAsset(scale, assetData.source);
                sprite.clickHandling = this._clickHandling;

                const currentFilters = sprite.filters;

                if(sprite.blendMode === 'add')
                {
                    // A filter draws the layer offscreen and composites it normally, which loses the additive glow.
                    if(currentFilters && currentFilters.length) sprite.filters = [];
                }
                else
                {
                    // The wired highlight goes on every layer but the shadow; a glow is drawn behind the furni instead.
                    const baseFilters = this.getBaseFilters((layerId !== this._shadowLayerIndex) && !usesWiredHighlightCompositeSilhouette(this._wiredHighlight.type));

                    if((currentFilters && currentFilters.length) || baseFilters.length)
                    {
                        // Highlights put on from outside (the furni chooser, the wired editor's picks) survive a redraw.
                        const overlayFilters = (currentFilters || []).filter(f => (f instanceof ChooserSelectionFilter) || (f instanceof WiredFilter));

                        sprite.filters = overlayFilters.length > 0 ? [...baseFilters, ...overlayFilters] : baseFilters;
                    }
                }
            }
            else
            {
                this.resetSprite(sprite);
            }
        }
        else
        {
            if(sprite) this.resetSprite(sprite);
        }
    }

    // The furni's own filters with the wired highlight after them, kept as one array while neither changes.
    private getBaseFilters(withHighlight: boolean): Filter[]
    {
        const highlightFilters = withHighlight ? this._wiredHighlight.filters : null;

        if(!highlightFilters) return this._filters;

        if((this._highlightBaseSource !== this._filters) || (this._highlightSource !== highlightFilters))
        {
            this._highlightBaseSource = this._filters;
            this._highlightSource = highlightFilters;
            this._highlightCombined = [...this._filters, ...highlightFilters];
        }

        return this._highlightCombined;
    }

    protected shouldHideInvisibleLayer(tag: string): boolean
    {
        return this._hideInvisibleLayers && (tag === 'invisible');
    }

    protected getLibraryAssetNameForSprite(asset: IGraphicAsset, sprite: IRoomObjectSprite): string
    {
        return asset.source;
    }

    protected getPostureForAssetFile(scale: number, assetName: string): string
    {
        return null;
    }

    private resetSprite(sprite: IRoomObjectSprite): void
    {
        if(!sprite) return;

        sprite.texture = null;
        sprite.libraryAssetName = '';
        sprite.posture = '';
        sprite.tag = '';
        sprite.offsetX = 0;
        sprite.offsetY = 0;
        sprite.flipH = false;
        sprite.flipV = false;
        sprite.relativeDepth = 0;
        sprite.clickHandling = false;
    }

    protected getSpriteAssetName(scale: number, layerId: number): string
    {
        if(!this._data || (layerId >= FurnitureVisualizationData.LAYER_LETTERS.length)) return '';

        let assetName = this._assetNames[layerId];
        let updated = this._updatedLayers[layerId];

        if(!assetName || !assetName.length)
        {
            assetName = this.cacheSpriteAssetName(scale, layerId, true);
            updated = (this._cacheSize !== 1);
        }

        if(updated) assetName += this.getFrameNumber(scale, layerId);

        return assetName;
    }

    protected cacheSpriteAssetName(scale: number, layerId: number, cache: boolean): string
    {
        const type = this._type;
        const size = (cache) ? this._cacheSize : this.getValidSize(scale);
        let layerCode = '';
        const isntIcon = (size !== 1);

        if(layerId !== this._shadowLayerIndex)
        {
            layerCode = FurnitureVisualizationData.LAYER_LETTERS[layerId] || '';
        }
        else
        {
            layerCode = 'sd';
        }

        if(layerCode === '') return null;

        const assetName = (this._type + ((isntIcon) ? ('_' + size + '_' + layerCode + '_' + this._direction + '_') : ('_icon_' + layerCode)));

        if(cache)
        {
            this._assetNames[layerId] = assetName;
            this._updatedLayers[layerId] = isntIcon;
        }

        return assetName;
    }

    protected getLayerTag(scale: number, direction: number, layerId: number): string
    {
        const existing = this._spriteTags[layerId];

        if(existing !== undefined) return existing;

        if(!this._data) return LayerData.DEFAULT_TAG;

        const tag = this._data.getLayerTag(scale, direction, layerId);

        this._spriteTags[layerId] = tag;

        return tag;
    }

    protected getLayerBlendMode(scale: number, direction: number, layerId: number): BLEND_MODES
    {
        const existing = this._spriteBlendModes[layerId];

        if(existing !== undefined) return existing;

        if(!this._data) return LayerData.DEFAULT_BLEND_MODE;

        const blendMode = this._data.getLayerBlendMode(scale, direction, layerId);

        this._spriteBlendModes[layerId] = blendMode;

        return blendMode;
    }

    protected getLayerAlpha(scale: number, direction: number, layerId: number): number
    {
        if(!this._alphaChanged)
        {
            const existing = this._spriteAlphas[layerId];

            if(existing !== undefined) return existing;
        }

        if(!this._data) return LayerData.DEFAULT_ALPHA;

        let alpha = this._data.getLayerAlpha(scale, direction, layerId);

        if(this._alphaMultiplier !== null) alpha = (alpha * this._alphaMultiplier);

        if(this.shouldSuppressBackgroundMatteLayer(scale, direction, layerId, alpha)) alpha = 0;

        this._spriteAlphas[layerId] = alpha;

        return alpha;
    }

    private shouldSuppressBackgroundMatteLayer(scale: number, direction: number, layerId: number, alpha: number): boolean
    {
        if((layerId < 0) || (alpha <= 0)) return false;

        const state = this.object?.getState?.(0) ?? 0;

        if(state === 0 || this.isBackgroundColorBlack()) return false;

        const totalLayers = Math.max((this._layerCount - this.getAdditionalLayerCount()), 0);

        if(totalLayers < 3) return false;

        if(!this.getLayerIgnoreMouse(scale, direction, layerId)) return false;

        const blendMode = this.getLayerBlendMode(scale, direction, layerId);

        if(blendMode === 'normal' || blendMode === 'add') return false;

        if(layerId !== (totalLayers - 1)) return false;

        if(this.getLayerBlendMode(scale, direction, 0) !== 'normal') return false;

        return (this.getLayerBlendMode(scale, direction, 1) !== 'normal');
    }


    private isBackgroundColorBlack(): boolean
    {
        const model = this.object?.model;

        if(!model) return false;

        const lightness = model.getValue<number>(RoomObjectVariable.FURNITURE_ROOM_BACKGROUND_COLOR_LIGHTNESS);

        if(lightness === undefined || lightness === null) return false;

        return (lightness <= 0);
    }

    protected getLayerColor(scale: number, layerId: number, colorId: number): number
    {
        const existing = this._spriteColors[layerId];

        if(existing !== undefined) return existing;

        if(!this._data) return ColorData.DEFAULT_COLOR;

        const color = this._data.getLayerColor(scale, layerId, colorId);

        this._spriteColors[layerId] = color;

        return color;
    }

    protected getLayerIgnoreMouse(scale: number, direction: number, layerId: number): boolean
    {
        const existing = this._spriteMouseCaptures[layerId];

        if(existing !== undefined) return existing;

        if(!this._data) return LayerData.DEFAULT_IGNORE_MOUSE;

        const ignoreMouse = this._data.getLayerIgnoreMouse(scale, direction, layerId);

        this._spriteMouseCaptures[layerId] = ignoreMouse;

        return ignoreMouse;
    }

    protected getLayerXOffset(scale: number, direction: number, layerId: number): number
    {
        const existing = this._spriteXOffsets[layerId];

        if(existing !== undefined) return existing;

        if(!this._data) return LayerData.DEFAULT_XOFFSET;

        const xOffset = this._data.getLayerXOffset(scale, direction, layerId);

        this._spriteXOffsets[layerId] = xOffset;

        return xOffset;
    }

    protected getLayerYOffset(scale: number, direction: number, layerId: number): number
    {
        if(layerId === this._shadowLayerIndex) return Math.ceil((this._furnitureLift * (scale / 2)));

        const existing = this._spriteYOffsets[layerId];

        if(existing !== undefined) return existing;

        if(!this._data) return LayerData.DEFAULT_YOFFSET;

        const yOffset = this._data.getLayerYOffset(scale, direction, layerId);

        this._spriteYOffsets[layerId] = yOffset;

        return yOffset;
    }

    protected getLayerZOffset(scale: number, direction: number, layerId: number): number
    {
        const existing = this._spriteZOffsets[layerId];

        if(existing !== undefined) return existing;

        if(!this._data) return LayerData.DEFAULT_ZOFFSET;

        const zOffset = this._data.getLayerZOffset(scale, direction, layerId);

        this._spriteZOffsets[layerId] = zOffset;

        return zOffset;
    }

    protected getValidSize(scale: number): number
    {
        if(!this._data) return scale;

        return this._data.getValidSize(scale);
    }

    protected setLayerCount(count: number): void
    {
        this._layerCount = count;
        this._shadowLayerIndex = count - this.getAdditionalLayerCount();
    }

    protected setDirection(direction: number): void
    {
        if(this._direction === direction) return;

        this._direction = direction;
    }

    protected getAdditionalLayerCount(): number
    {
        return 1;
    }

    protected updateAnimation(scale: number): number
    {
        return 0;
    }

    protected getFrameNumber(scale: number, layerId: number): number
    {
        return 0;
    }

    protected getPostureForAsset(scale: number, name: string): string
    {
        return null;
    }

    public getAsset(name: string, layerId: number = -1): IGraphicAsset
    {
        if(!this.asset) return null;

        return this.asset.getAsset(name);
    }

    public getTexture(scale: number, layerId: number, asset: IGraphicAsset): Texture
    {
        return asset?.texture ?? null;
    }

    public set lookThrough(flag: boolean)
    {
        if(this._lookThrough == flag) return;

        this._lookThrough = flag;
        this._needsLookThroughUpdate = true;
    }

    protected get direction(): number
    {
        return this._direction;
    }

    protected get data(): FurnitureVisualizationData
    {
        return this._data;
    }
}
