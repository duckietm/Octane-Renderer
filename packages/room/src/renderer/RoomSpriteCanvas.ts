import { IPlaneVisualization, IRoomCanvasMouseListener, IRoomGeometry, IRoomObject, IRoomObjectSprite, IRoomObjectSpriteVisualization, IRoomPlane, IRoomRenderingCanvas, IRoomSpriteCanvasContainer, IRoomSpriteMouseEvent, MouseEventType, RoomObjectSpriteData, RoomObjectSpriteType } from '@octane/api';
import { GetConfiguration } from '@octane/configuration';
import { RoomSpriteMouseEvent } from '@octane/events';
import { GetTicker, TextureUtils, Vector3d } from '@octane/utils';
import { Container, Graphics, Matrix, Point, PointData, Rectangle, Texture } from 'pixi.js';
import { RoomEnterEffect, RoomGeometry, RoomRotatingEffect, RoomShakingEffect } from '../utils';
import { RoomObjectCache, RoomObjectCacheItem } from './cache';
import { getObjectAltitudeDepth } from './ObjectAltitudeDepth';
import { ExtendedSprite, ObjectMouseData, SortableSprite } from './utils';

export class RoomSpriteCanvas implements IRoomRenderingCanvas
{
    // Slow mode: when rendering a frame costs too much, furni animate on every other frame.
    private static SLOW_WARMUP_FRAMES: number = 50;
    private static SLOW_SAMPLE_FRAMES: number = 10;
    private static SLOW_ENTER_MS: number = 10;
    private static SLOW_LEAVE_MS: number = 6;

    private _geometry: RoomGeometry;
    private _animationFPS: number;
    private _renderTimestamp: number = 0;
    private _totalTimeRunning: number = 0;
    private _lastFrame: number = 0;

    private _master: Container = null;
    private _display: Container = null;
    private _mask: Graphics = null;
    private _boundaryMask: Graphics = null;
    private _lastBoundaryOffsetX: number = NaN;
    private _lastBoundaryOffsetY: number = NaN;
    private _lastBoundaryGeometryId: number = -1;
    private _lastBoundaryScale: number = NaN;
    private _lastBoundaryFlipped: boolean = false;

    private _sortableSprites: SortableSprite[] = [];
    private _sortableSpritesDirty: boolean = false;
    private _spriteCount: number = 0;
    private _activeSpriteCount: number = 0;
    private _spritePool: ExtendedSprite[] = [];
    private _skipObjectUpdate: boolean = false;
    private _runningSlow: boolean = false;
    private _slowWarmupFrames: number = 0;
    private _slowSampleFrames: number = 0;
    private _slowSampleTime: number = 0;

    private _width: number = 0;
    private _height: number = 0;
    private _renderedWidth: number = 0;
    private _renderedHeight: number = 0;
    private _screenOffsetX: number = 0;
    private _screenOffsetY: number = 0;
    private _mouseLocation: Point = new Point();
    private _mouseOldX: number = 0;
    private _mouseOldY: number = 0;
    private _mouseCheckCount: number = 0;
    private _mouseSpriteWasHit: boolean = false;
    private _mouseActiveObjects: Map<string, ObjectMouseData> = new Map();
    private _mouseCheckedSprites: Set<string> = new Set();
    private _eventCache: Map<string, IRoomSpriteMouseEvent> = new Map();
    private _eventId: number = 0;
    private _scale: number = 1;
    private _isFlipped: boolean = false;

    private _SafeStr_4507: boolean = false;
    private _rotation: number = 0;
    private _rotationOrigin: Vector3d = null;
    private _rotationRodLength: number = 0;
    private _effectDirection: Vector3d;
    private _effectLocation: Vector3d;
    private _SafeStr_795: number = 0;

    private _noSpriteVisibilityChecking: boolean = false;
    private _usesExclusionRectangles: boolean = false;
    private _usesMask: boolean = true;
    private _canvasUpdated: boolean = false;

    private _objectCache: RoomObjectCache;

    private _mouseListener: IRoomCanvasMouseListener = null;

    constructor(
        private _id: number,
        private _container: IRoomSpriteCanvasContainer,
        width: number,
        height: number,
        scale: number)
    {
        this._geometry = new RoomGeometry(scale, new Vector3d(-135, 30, 0), new Vector3d(11, 11, 5), new Vector3d(-135, 0.5, 0));
        this._animationFPS = GetConfiguration().getValue<number>('system.fps.animation', 24);
        this._objectCache = new RoomObjectCache(this._container.roomObjectVariableAccurateZ);

        this.setupCanvas();
        this.initialize(width, height);
    }

    private setupCanvas(): void
    {
        if(!this._master) this._master = new Container();

        this._master.cullableChildren = false;

        if(!this._display)
        {
            const display = new Container();

            display.isRenderGroup = false;
            display.cullableChildren = false;

            this._master.addChild(display);

            this._display = display;
        }

        if(!this._boundaryMask)
        {
            this._boundaryMask = new Graphics();

            this._master.addChild(this._boundaryMask);
        }
    }

    public dispose(): void
    {
        this.cleanSprites(0, true);

        if(this._geometry)
        {
            this._geometry.dispose();

            this._geometry = null;
        }

        if(this._mask) this._mask = null;

        if(this._boundaryMask) this._boundaryMask = null;

        if(this._objectCache)
        {
            this._objectCache.dispose();

            this._objectCache = null;
        }

        if(this._master)
        {
            while(this._master.children.length)
            {
                const child = this._master.removeChildAt(0);

                child.destroy();
            }

            if(this._master.parent) this._master.parent.removeChild(this._master);

            this._master.destroy();

            this._master = null;
        }

        this._display = null;
        this._sortableSprites = [];

        if(this._mouseActiveObjects)
        {
            this._mouseActiveObjects.clear();

            this._mouseActiveObjects = null;
        }

        if(this._spritePool)
        {
            for(const sprite of this._spritePool)
            {
                this.cleanSprite(sprite, true);
            }

            this._spritePool = [];
        }

        if(this._eventCache)
        {
            this._eventCache.clear();

            this._eventCache = null;
        }

        this._mouseListener = null;
    }

    public initialize(width: number, height: number): void
    {
        width = width < 1 ? 1 : width;
        height = height < 1 ? 1 : height;

        if(this._usesMask)
        {
            if(!this._mask)
            {
                // A Graphics rectangle masks through the stencil buffer; a sprite
                // mask would cost a render-to-texture plus a filter pass per frame.
                this._mask = new Graphics().rect(0, 0, width, height).fill(0xFFFFFF);

                if(this._master)
                {
                    this._master.addChild(this._mask);
                    if(this._display) this.setDisplayMask(this._mask);
                }
            }
            else
            {
                this._mask.clear().rect(0, 0, width, height).fill(0xFFFFFF);
            }
        }

        if(this._master)
        {
            if(this._master.filterArea)
            {
                const filterArea = this._master.filterArea;
                filterArea.width = width;
                filterArea.height = height;
            }
            else
            {
                this._master.filterArea = new Rectangle(0, 0, width, height);
            }
        }

        this._width = width;
        this._height = height;
    }

    // Both masks are white Graphics in the master container. Pixi only hides a stencil mask
    // while it is assigned; once replaced it draws again, as a white shape over the room.
    // So the mask that is not in use is hidden here.
    private setDisplayMask(mask: Graphics): void
    {
        if(!this._display) return;

        this._display.mask = mask;

        if(this._mask) this._mask.visible = (mask === this._mask);
        if(this._boundaryMask) this._boundaryMask.visible = (mask === this._boundaryMask);
    }

    public setMask(flag: boolean): void
    {
        if(flag && !this._usesMask)
        {
            this._usesMask = true;

            if(this._mask && (this._mask.parent !== this._master))
            {
                this._master.addChild(this._mask);

                this.setDisplayMask(this._mask);
            }
        }

        else if(!flag && this._usesMask)
        {
            this._usesMask = false;

            if(this._mask && (this._mask.parent === this._master))
            {
                this._master.removeChild(this._mask);

                this.setDisplayMask(null);
            }
        }
    }

    public setScale(scale: number, point: PointData = null, offsetPoint: PointData = null, isFlipForced: boolean = false): void
    {
        // The zoom scale is always positive; the flip is a separate flag so it
        // can be toggled back and zooming keeps working while flipped.
        this.setTransform(Math.abs(scale), this._isFlipped, point, offsetPoint);
    }

    public setFlip(flag: boolean, point: PointData = null, offsetPoint: PointData = null): void
    {
        this.setTransform(this._scale, flag, point, offsetPoint);
    }

    private setTransform(scale: number, isFlipped: boolean, point: PointData, offsetPoint: PointData): void
    {
        if(!this._master || !this._display) return;

        if(!point) point = { x: (this._width / 2), y: (this._height / 2) };

        if(!offsetPoint) offsetPoint = point;

        // Keep the room content under `point` fixed: convert it to display space
        // with the old transform, then place it back at `offsetPoint` with the new one.
        const localX = ((point.x - this._screenOffsetX) / this.displayScale);
        const localY = ((point.y - this._screenOffsetY) / this.displayScale);

        this._scale = scale;
        this._isFlipped = isFlipped;

        this.screenOffsetX = (offsetPoint.x - (localX * this.displayScale));
        this.screenOffsetY = (offsetPoint.y - (localY * this.displayScale));
    }

    // Signed display scale on both axes: the official flip turns the room 180
    // degrees around the anchor point, it is not a horizontal mirror.
    private get displayScale(): number
    {
        return (this._isFlipped ? -this._scale : this._scale);
    }

    private updateBoundaryMask(): void
    {
        if(!this._boundaryMask || !this._display || !this._geometry) return;

        const geometryId = this._geometry.updateId;
        const offsetX = this._screenOffsetX;
        const offsetY = this._screenOffsetY;
        const scale = this._scale;
        const displayScale = this.displayScale;
        const flipped = this._isFlipped;

        if(geometryId === this._lastBoundaryGeometryId && offsetX === this._lastBoundaryOffsetX && offsetY === this._lastBoundaryOffsetY && scale === this._lastBoundaryScale && flipped === this._lastBoundaryFlipped) return;

        this._lastBoundaryGeometryId = geometryId;
        this._lastBoundaryOffsetX = offsetX;
        this._lastBoundaryOffsetY = offsetY;
        this._lastBoundaryScale = scale;
        this._lastBoundaryFlipped = flipped;

        const pts: { x: number; y: number }[] = [];
        const w2 = this._width / 2;
        const h2 = this._height / 2;

        for(const object of this._container.objects.values())
        {
            if(!object) continue;

            const viz = object.visualization as unknown as IPlaneVisualization;

            if(!viz || !viz.planes) continue;

            for(const plane of (viz.planes))
            {
                if(!plane || plane.type === 3) continue;

                const loc = plane.location;
                const ls = plane.leftSide;
                const rs = plane.rightSide;

                if(!loc || !ls || !rs) continue;

                const corners = [
                    new Vector3d(loc.x, loc.y, loc.z),
                    new Vector3d(loc.x + rs.x, loc.y + rs.y, loc.z + rs.z),
                    new Vector3d(loc.x + ls.x + rs.x, loc.y + ls.y + rs.y, loc.z + ls.z + rs.z),
                    new Vector3d(loc.x + ls.x, loc.y + ls.y, loc.z + ls.z)
                ];

                for(const c of corners)
                {
                    const sp = this._geometry.getScreenPosition(c);

                    if(!sp) continue;

                    pts.push({ x: (sp.x + w2) * displayScale + offsetX, y: (sp.y + h2) * displayScale + offsetY });
                }
            }

            break;
        }

        this._boundaryMask.clear();

        if(pts.length < 3)
        {
            if(this._display.mask === this._boundaryMask) this.setDisplayMask(this._mask ?? null);

            return;
        }

        const hull = RoomSpriteCanvas.convexHull(pts);
        const maskPolygon = RoomSpriteCanvas.createMaskPolygon(hull);

        this._boundaryMask.poly(maskPolygon.flatMap(p => [p.x, p.y]));
        this._boundaryMask.fill(0xFFFFFF);

        if(this._display.mask !== this._boundaryMask)
        {
            this.setDisplayMask(this._boundaryMask);
        }
    }

    private static convexHull(points: { x: number; y: number }[]): { x: number; y: number }[]
    {
        if(points.length < 3) return points;

        const sorted = [...points].sort((a, b) => (a.x !== b.x ? a.x - b.x : a.y - b.y));

        const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
            (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

        const lower: { x: number; y: number }[] = [];

        for(const p of sorted)
        {
            while(lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();

            lower.push(p);
        }

        const upper: { x: number; y: number }[] = [];

        for(let i = sorted.length - 1; i >= 0; i--)
        {
            const p = sorted[i];

            while(upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();

            upper.push(p);
        }

        lower.pop();
        upper.pop();

        return [...lower, ...upper];
    }

    private static createMaskPolygon(hull: { x: number; y: number }[], extension: number = 5000): { x: number; y: number }[]
    {
        if(hull.length < 3) return hull;

        let leftIdx = 0;
        let rightIdx = 0;
        let maxY = hull[0].y;

        for(let i = 1; i < hull.length; i++)
        {
            if(hull[i].x < hull[leftIdx].x) leftIdx = i;
            if(hull[i].x > hull[rightIdx].x) rightIdx = i;
            if(hull[i].y > maxY) maxY = hull[i].y;
        }

        return [
            { x: hull[leftIdx].x - extension, y: -extension },
            { x: hull[rightIdx].x + extension, y: -extension },
            { x: hull[rightIdx].x + extension, y: maxY + extension },
            { x: hull[leftIdx].x - extension, y: maxY + extension }
        ];
    }

    public render(time: number, update: boolean = false): void
    {
        this._canvasUpdated = false;

        this._totalTimeRunning += GetTicker().deltaTime;

        if(this._totalTimeRunning === this._renderTimestamp) return;

        if(time === -1) time = (this._renderTimestamp + 1);

        if(!this._container || !this._geometry) return;

        const startedAt = performance.now();

        if((this._width !== this._renderedWidth) || (this._height !== this._renderedHeight)) update = true;

        if((this._display.x !== this._screenOffsetX) || (this._display.y !== this._screenOffsetY))
        {
            this._display.x = Math.floor(this._screenOffsetX);
            this._display.y = Math.floor(this._screenOffsetY);

            update = true;
        }

        if((this._display.scale.x !== this.displayScale) || (this._display.scale.y !== this.displayScale))
        {
            this._display.scale.set(this.displayScale);

            update = true;
        }

        this.doMagic();

        const frame = Math.round(this._totalTimeRunning / (60 / this._animationFPS));

        let updateVisuals = false;

        if(frame !== this._lastFrame)
        {
            this._lastFrame = frame;

            updateVisuals = true;

            this._skipObjectUpdate = !this._skipObjectUpdate;
        }

        let spriteCount = 0;

        const objects = this._container.objects;

        if(objects.size)
        {
            for(const object of objects.values())
            {
                if(!object) continue;

                spriteCount = (spriteCount + this.renderObject(object, time, update, updateVisuals, spriteCount));
            }
        }

        // Only sort when a depth changed or a sprite came or went. Disposed sprites sit at
        // -infinity until the sort moves them to the end, where the splice drops them.
        if(this._sortableSpritesDirty || (this._sortableSprites.length !== spriteCount))
        {
            this._sortableSprites.sort((a, b) => (b.z - a.z));

            this._sortableSpritesDirty = false;
        }

        if(spriteCount < this._sortableSprites.length) this._sortableSprites.splice(spriteCount);

        let iterator = 0;

        while(iterator < spriteCount)
        {
            const sprite = this._sortableSprites[iterator];

            if(sprite && sprite.sprite) this.renderSprite(iterator, sprite);

            iterator++;
        }

        this.cleanSprites(spriteCount);

        this.updateBoundaryMask();

        if(update) this._canvasUpdated = true;

        this._renderTimestamp = this._totalTimeRunning;
        this._renderedWidth = this._width;
        this._renderedHeight = this._height;

        this.measureRenderTime(performance.now() - startedAt);
    }

    private measureRenderTime(time: number): void
    {
        if(this._slowWarmupFrames < RoomSpriteCanvas.SLOW_WARMUP_FRAMES)
        {
            this._slowWarmupFrames++;

            return;
        }

        this._slowSampleFrames++;
        this._slowSampleTime += time;

        if(this._slowSampleFrames < RoomSpriteCanvas.SLOW_SAMPLE_FRAMES) return;

        const average = (this._slowSampleTime / this._slowSampleFrames);

        this._slowSampleFrames = 0;
        this._slowSampleTime = 0;

        if(!this._runningSlow && (average > RoomSpriteCanvas.SLOW_ENTER_MS)) this._runningSlow = true;
        else if(this._runningSlow && (average < RoomSpriteCanvas.SLOW_LEAVE_MS)) this._runningSlow = false;
    }

    public skipSpriteVisibilityChecking(): void
    {
        this._noSpriteVisibilityChecking = true;

        this.render(-1, true);
    }

    public resumeSpriteVisibilityChecking(): void
    {
        this._noSpriteVisibilityChecking = false;
    }

    public getSortableSpriteList(): RoomObjectSpriteData[]
    {
        return this._objectCache.getSortableSpriteList();
    }

    public getPlaneSortableSprites(): SortableSprite[]
    {
        return this._objectCache.getPlaneSortableSprites();
    }

    public removeFromCache(identifier: string): void
    {
        this._objectCache.removeObjectCache(Number(identifier));

        this._sortableSpritesDirty = true;
    }

    private renderObject(object: IRoomObject, time: number, update: boolean, updateVisuals: boolean, count: number): number
    {
        if(!object) return 0;

        const visualization = object.visualization as IRoomObjectSpriteVisualization;
        // The cache is keyed by the instance id itself, so no id string is built per object per frame.
        const instanceId = object.instanceId;

        if(!visualization)
        {
            this.removeObjectCache(instanceId);

            return 0;
        }

        const cache = this.getCacheItem(instanceId);
        cache.objectId = instanceId;

        const locationCache = cache.location;
        const sortableCache = cache.sprites;

        const vector = locationCache.updateLocation(object, this._geometry);

        if(!vector)
        {
            this.removeObjectCache(instanceId);

            return 0;
        }

        if(updateVisuals) visualization.update(this._geometry, time, (!sortableCache.isEmpty || update), (this._skipObjectUpdate && this._runningSlow), !sortableCache.isEmpty);

        if(locationCache.locationChanged) update = true;

        if(!sortableCache.needsUpdate(visualization.instanceId, visualization.updateSpriteCounter) && !update)
        {
            return sortableCache.spriteCount;
        }

        let x = vector.x;
        let y = vector.y;
        let z = (vector.z - getObjectAltitudeDepth(object));

        if(x > 0) z = (z + (x * 1.2E-7));
        else z = (z + (-(x) * 1.2E-7));

        x = (x + Math.trunc(this._width / 2));
        y = (y + Math.trunc(this._height / 2));

        let spriteCount = 0;

        const sprites = visualization.sprites;
        const totalSprites = (sprites ? sprites.length : 0);

        for(let index = 0; index < totalSprites; index++)
        {
            const sprite = sprites[index];

            if(!sprite || !sprite.visible) continue;

            const texture = sprite.texture;
            const baseTexture = texture && texture.source;

            if(!texture || !baseTexture) continue;

            const spriteX = ((x + sprite.offsetX) + this._screenOffsetX);
            const spriteY = ((y + sprite.offsetY) + this._screenOffsetY);
            // A plane drawn from its tile has an EMPTY texture; its size is the draw data's.
            const width = (sprite.planeDrawData ? sprite.width : texture.width);
            const height = (sprite.planeDrawData ? sprite.height : texture.height);

            if(sprite.flipH)
            {
                const checkX = ((x + (-(width + (-(sprite.offsetX))))) + this._screenOffsetX);

                if(!this.isSpriteVisible(checkX, spriteY, width, height)) continue;
            }

            else if(sprite.flipV)
            {
                const checkY = ((y + (-(height + (-(sprite.offsetY))))) + this._screenOffsetY);

                if(!this.isSpriteVisible(spriteX, checkY, width, height)) continue;
            }

            else
            {
                if(!this.isSpriteVisible(spriteX, spriteY, width, height)) continue;
            }

            let sortableSprite = sortableCache.getSprite(spriteCount);

            if(!sortableSprite)
            {
                sortableSprite = new SortableSprite();

                sortableCache.addSprite(sortableSprite);

                this._sortableSprites.push(sortableSprite);

                this._sortableSpritesDirty = true;

                // A sortable sprite stays with its object, so its name is built once.
                sortableSprite.name = instanceId.toString();
            }

            sortableSprite.sprite = sprite;

            if((sprite.spriteType === RoomObjectSpriteType.AVATAR) || (sprite.spriteType === RoomObjectSpriteType.AVATAR_OWN))
            {
                // A sprite belongs to one object for life: name it once instead of building the
                // same string every frame for every avatar.
                if(!sprite.libraryAssetName || !sprite.libraryAssetName.startsWith('avatar_')) sprite.libraryAssetName = 'avatar_' + object.id;
            }

            sortableSprite.x = (spriteX - this._screenOffsetX);
            sortableSprite.y = (spriteY - this._screenOffsetY);

            const spriteZ = ((z + sprite.relativeDepth) + (3.7E-11 * count));

            if(sortableSprite.z !== spriteZ)
            {
                sortableSprite.z = spriteZ;

                this._sortableSpritesDirty = true;
            }

            spriteCount++;
            count++;
        }

        if(spriteCount < sortableCache.spriteCount) this._sortableSpritesDirty = true;

        sortableCache.setSpriteCount(spriteCount);

        this._canvasUpdated = true;

        return spriteCount;
    }

    private getExtendedSprite(index: number): ExtendedSprite
    {
        if((index < 0) || (index >= this._spriteCount)) return null;

        const sprite = (this._display.getChildAt(index));

        if(!sprite) return null;

        return (sprite as ExtendedSprite);
    }

    protected getExtendedSpriteIdentifier(sprite: ExtendedSprite): string
    {
        if(!sprite) return '';

        return sprite.label;
    }

    private renderSprite(index: number, sprite: SortableSprite): boolean
    {
        if(index >= this._spriteCount)
        {
            this.createAndAddSprite(sprite, index);

            return true;
        }

        if(!sprite) return false;

        const objectSprite = sprite.sprite;
        const extendedSprite = this.getExtendedSprite(index);

        if(!objectSprite || !extendedSprite) return false;

        if(extendedSprite.varyingDepth !== objectSprite.varyingDepth)
        {
            if(extendedSprite.varyingDepth && !objectSprite.varyingDepth)
            {
                this._display.removeChildAt(index);

                this._spritePool.push(extendedSprite);

                return this.renderSprite(index, sprite);
            }

            this.createAndAddSprite(sprite, index);

            return true;
        }

        if(extendedSprite.needsUpdate(objectSprite.id, objectSprite.updateCounter) || RoomEnterEffect.isVisualizationOn())
        {
            extendedSprite.tag = objectSprite.tag;
            extendedSprite.alphaTolerance = objectSprite.alphaTolerance;
            extendedSprite.label = sprite.name;
            extendedSprite.varyingDepth = objectSprite.varyingDepth;
            extendedSprite.clickHandling = objectSprite.clickHandling;
            extendedSprite.skipMouseHandling = objectSprite.skipMouseHandling;
            extendedSprite.setFilters(objectSprite.filters);

            const alpha = (objectSprite.alpha / 255);

            if(extendedSprite.alpha !== alpha) extendedSprite.alpha = alpha;

            if(extendedSprite.tint !== objectSprite.color) extendedSprite.tint = objectSprite.color;

            if(extendedSprite.blendMode !== objectSprite.blendMode) extendedSprite.blendMode = objectSprite.blendMode;

            const objectTexture = ((objectSprite.texture && !objectSprite.texture.destroyed && objectSprite.texture.source) ? objectSprite.texture : Texture.EMPTY);

            if(extendedSprite.sourceTexture !== objectTexture) extendedSprite.setTexture(objectTexture);

            const magnitude = (objectSprite.scale && (objectSprite.scale > 0)) ? objectSprite.scale : 1;

            extendedSprite.scale.x = objectSprite.flipH ? -magnitude : magnitude;
            extendedSprite.scale.y = objectSprite.flipV ? -magnitude : magnitude;

            extendedSprite.updateHighlight();
        }

        extendedSprite.setPlaneDrawData(objectSprite.planeDrawData);
        extendedSprite.validateHighlight();

        extendedSprite.x = Math.round(sprite.x);
        extendedSprite.y = Math.round(sprite.y);

        extendedSprite.offsetX = objectSprite.offsetX;
        extendedSprite.offsetY = objectSprite.offsetY;

        return true;
    }

    private createAndAddSprite(sortableSprite: SortableSprite, index: number = -1): void
    {
        const sprite = sortableSprite.sprite;

        if(!sprite) return;

        let extendedSprite: ExtendedSprite = null;

        if(this._spritePool.length > 0) extendedSprite = this._spritePool.pop();

        let textureSet = false;

        if(!extendedSprite)
        {
            extendedSprite = new ExtendedSprite({
                texture: sprite.texture
            });

            textureSet = true;
        }

        extendedSprite.setPlaneDrawData(null);

        if(extendedSprite.children.length) extendedSprite.removeChildren();

        extendedSprite.tag = sprite.tag;
        extendedSprite.alphaTolerance = sprite.alphaTolerance;
        extendedSprite.alpha = (sprite.alpha / 255);
        extendedSprite.tint = sprite.color;
        extendedSprite.x = sortableSprite.x;
        extendedSprite.y = sortableSprite.y;
        extendedSprite.offsetX = sprite.offsetX;
        extendedSprite.offsetY = sprite.offsetY;
        extendedSprite.label = sprite.name;
        extendedSprite.varyingDepth = sprite.varyingDepth;
        extendedSprite.clickHandling = sprite.clickHandling;
        extendedSprite.skipMouseHandling = sprite.skipMouseHandling;
        extendedSprite.blendMode = sprite.blendMode;
        extendedSprite.setFilters(sprite.filters);

        if(!textureSet) extendedSprite.setTexture(sprite.texture);

        extendedSprite.setPlaneDrawData(sprite.planeDrawData);

        // A pooled sprite keeps its previous scale, so set it like the update path does.
        const magnitude = (sprite.scale && (sprite.scale > 0)) ? sprite.scale : 1;

        extendedSprite.scale.x = sprite.flipH ? -magnitude : magnitude;
        extendedSprite.scale.y = sprite.flipV ? -magnitude : magnitude;

        this.updateEnterRoomEffect(extendedSprite, sprite);

        if((index < 0) || (index >= this._spriteCount))
        {
            this._display.addChild(extendedSprite);

            this._spriteCount++;
        }
        else
        {
            this._display.addChildAt(extendedSprite, index);
        }

        // After attaching, so the display's zoom and flip are known.
        extendedSprite.updateHighlight();

        this._activeSpriteCount++;
    }

    private cleanSprites(spriteCount: number, destroy: boolean = false): void
    {
        if(!this._display) return;

        if(spriteCount < 0) spriteCount = 0;

        if(spriteCount !== this._activeSpriteCount) this._canvasUpdated = true;

        if((spriteCount < this._activeSpriteCount) || !this._activeSpriteCount)
        {
            // Detaching every sprite at once, last first as before, avoids a linear child search
            // per sprite (removeChild and removeChildAt both look the child up). Only the whole
            // display: Pixi's removeChildren(begin, end) removes end items from begin, not a range.
            if(destroy && !spriteCount && this._spriteCount && (this._spriteCount === this._display.children.length))
            {
                for(const sprite of this._display.removeChildren()) this.cleanSprite(sprite as ExtendedSprite, true);
            }
            else
            {
                let iterator = (this._spriteCount - 1);

                while(iterator >= spriteCount)
                {
                    this.cleanSprite(this.getExtendedSprite(iterator), destroy);

                    iterator--;
                }
            }
        }

        this._activeSpriteCount = spriteCount;
    }

    private updateEnterRoomEffect(sprite: ExtendedSprite, objectSprite: IRoomObjectSprite): void
    {
        if(!RoomEnterEffect.isVisualizationOn() || !objectSprite) return;

        switch(objectSprite.spriteType)
        {
            case RoomObjectSpriteType.AVATAR_OWN:
                return;
            case RoomObjectSpriteType.ROOM_PLANE:
                sprite.alpha = RoomEnterEffect.getDelta(0.9);
                return;
            case RoomObjectSpriteType.AVATAR:
                sprite.alpha = RoomEnterEffect.getDelta(0.5);
                return;
            default:
                sprite.alpha = RoomEnterEffect.getDelta(0.1);
        }
    }

    private cleanSprite(sprite: ExtendedSprite, destroy: boolean): void
    {
        if(!sprite) return;

        if(!destroy)
        {
            // An idle sprite lets go of its filters too, so it holds no highlight or glow of a sprite gone.
            sprite.setPlaneDrawData(null);
            sprite.setFilters(null);
            sprite.setTexture(null);
        }
        else
        {
            if(sprite.parent) sprite.parent.removeChild(sprite);

            sprite.destroy({
                children: true
            });
        }
    }

    public update(): void
    {
        this._mouseCheckCount = 0;

        this._eventId++;
    }

    public setMouseListener(listener: IRoomCanvasMouseListener): void
    {
        this._mouseListener = listener;
    }

    private getCacheItem(id: number): RoomObjectCacheItem
    {
        return this._objectCache.getObjectCache(id);
    }

    private removeObjectCache(id: number): void
    {
        this._objectCache.removeObjectCache(id);

        this._sortableSpritesDirty = true;
    }

    private isSpriteVisible(x: number, y: number, width: number, height: number): boolean
    {
        if(this._noSpriteVisibilityChecking) return true;

        const displayScale = this.displayScale;

        x = (((x - this._screenOffsetX) * displayScale) + this._screenOffsetX);
        y = (((y - this._screenOffsetY) * displayScale) + this._screenOffsetY);
        width = (width * displayScale);
        height = (height * displayScale);

        // A flipped room projects the sprite behind its origin, so the span is
        // normalised back to a positive size before the bounds test.
        if(width < 0)
        {
            x += width;
            width = -width;
        }

        if(height < 0)
        {
            y += height;
            height = -height;
        }

        if(((x < this._width) && ((x + width) >= 0)) && ((y < this._height) && ((y + height) >= 0)))
        {
            if(!this._usesExclusionRectangles) return true;
        }

        return false;
    }

    public handleMouseEvent(x: number, y: number, type: string, altKey: boolean, ctrlKey: boolean, shiftKey: boolean, buttonDown: boolean): boolean
    {
        x = (x - this._screenOffsetX);
        y = (y - this._screenOffsetY);

        // Screen coordinates map back through the signed scale, so a flipped
        // room still hit-tests the sprite that is actually under the cursor.
        const displayScale = this.displayScale;

        this._mouseLocation.x = (x / displayScale);
        this._mouseLocation.y = (y / displayScale);

        if((this._mouseCheckCount > 0) && (type == MouseEventType.MOUSE_MOVE)) return this._mouseSpriteWasHit;

        this._mouseSpriteWasHit = this.checkMouseHits(Math.trunc(x / displayScale), Math.trunc(y / displayScale), type, altKey, ctrlKey, shiftKey, buttonDown);

        this._mouseCheckCount++;

        return this._mouseSpriteWasHit;
    }

    private static SCRATCH_MOUSE_POINT: Point = new Point();

    private checkMouseHits(x: number, y: number, type: string, altKey: boolean = false, ctrlKey: boolean = false, shiftKey: boolean = false, buttonDown: boolean = false): boolean
    {
        const checkedSprites = this._mouseCheckedSprites;

        checkedSprites.clear();

        let didHitSprite = false;
        let mouseEvent: IRoomSpriteMouseEvent = null;
        let spriteId = (this._activeSpriteCount - 1);

        const hitPoint = RoomSpriteCanvas.SCRATCH_MOUSE_POINT;

        while(spriteId >= 0)
        {
            const extendedSprite = this.getExtendedSprite(spriteId);

            if(extendedSprite && (hitPoint.set((x - extendedSprite.x), (y - extendedSprite.y)), extendedSprite.containsPoint(hitPoint)))
            {
                if(!extendedSprite.skipMouseHandling)
                {
                    if(extendedSprite.clickHandling && ((type === MouseEventType.MOUSE_CLICK) || (type === MouseEventType.DOUBLE_CLICK)))
                    {
                        // The sprite handles its own clicks; nothing to dispatch here.
                    }
                    else
                    {
                        const identifier = this.getExtendedSpriteIdentifier(extendedSprite);

                        if(!checkedSprites.has(identifier))
                        {
                            const tag = extendedSprite.tag;

                            let mouseData = this._mouseActiveObjects.get(identifier);

                            if(mouseData)
                            {
                                if(mouseData.spriteTag !== tag)
                                {
                                    mouseEvent = this.createMouseEvent(0, 0, 0, 0, MouseEventType.ROLL_OUT, mouseData.spriteTag, altKey, ctrlKey, shiftKey, buttonDown);

                                    this.bufferMouseEvent(mouseEvent, identifier);
                                }
                            }

                            if((type === MouseEventType.MOUSE_MOVE) && (!mouseData || (mouseData.spriteTag !== tag)))
                            {
                                mouseEvent = this.createMouseEvent(x, y, (x - extendedSprite.x), (y - extendedSprite.y), MouseEventType.ROLL_OVER, tag, altKey, ctrlKey, shiftKey, buttonDown);
                            }
                            else
                            {
                                mouseEvent = this.createMouseEvent(x, y, (x - extendedSprite.x), (y - extendedSprite.y), type, tag, altKey, ctrlKey, shiftKey, buttonDown);

                                mouseEvent.spriteOffsetX = extendedSprite.offsetX;
                                mouseEvent.spriteOffsetY = extendedSprite.offsetY;
                            }

                            if(!mouseData)
                            {
                                mouseData = new ObjectMouseData();

                                mouseData.objectId = identifier;
                                this._mouseActiveObjects.set(identifier, mouseData);
                            }

                            mouseData.spriteTag = tag;

                            if(((type !== MouseEventType.MOUSE_MOVE) || (x !== this._mouseOldX)) || (y !== this._mouseOldY))
                            {
                                this.bufferMouseEvent(mouseEvent, identifier);
                            }

                            checkedSprites.add(identifier);
                        }

                        didHitSprite = true;
                    }
                }
            }

            spriteId--;
        }

        for(const [ key, existing ] of this._mouseActiveObjects)
        {
            if(!key || checkedSprites.has(key)) continue;

            this._mouseActiveObjects.delete(key);

            const mouseEvent = this.createMouseEvent(0, 0, 0, 0, MouseEventType.ROLL_OUT, existing.spriteTag, altKey, ctrlKey, shiftKey, buttonDown);

            this.bufferMouseEvent(mouseEvent, key);
        }

        checkedSprites.clear();

        this.processMouseEvents();
        this._mouseOldX = x;
        this._mouseOldY = y;

        return didHitSprite;
    }

    protected createMouseEvent(x: number, y: number, localX: number, localY: number, type: string, tag: string, altKey: boolean, ctrlKey: boolean, shiftKey: boolean, buttonDown: boolean): IRoomSpriteMouseEvent
    {
        const screenX: number = (x - (this._width / 2));
        const screenY: number = (y - (this._height / 2));
        const canvasName = `canvas_${this._id}`;

        return new RoomSpriteMouseEvent(type, ((canvasName + '_') + this._eventId), canvasName, tag, screenX, screenY, localX, localY, ctrlKey, altKey, shiftKey, buttonDown);
    }

    protected bufferMouseEvent(event: IRoomSpriteMouseEvent, spriteId: string): void
    {
        if(!event || !this._eventCache) return;

        this._eventCache.delete(spriteId);
        this._eventCache.set(spriteId, event);
    }

    protected processMouseEvents(): void
    {
        if(!this._container || !this._eventCache) return;

        for(const [key, event] of this._eventCache.entries())
        {
            if(!this._eventCache) return;

            if(!event) continue;

            const roomObject = this._container.getRoomObject(parseInt(key));

            if(!roomObject) continue;

            if(this._mouseListener)
            {
                this._mouseListener.processRoomCanvasMouseEvent(event, roomObject, this._geometry);
            }
            else
            {
                const logic = roomObject.mouseHandler;

                if(logic)
                {
                    logic.mouseEvent(event, this._geometry);
                }
            }
        }

        if(this._eventCache) this._eventCache.clear();
    }

    public getDisplayAsTexture(): Texture
    {
        this._noSpriteVisibilityChecking = true;

        const currentScale = this._scale;
        const currentFlipped = this._isFlipped;
        const currentOffsetX = this._screenOffsetX;
        const currentOffsetY = this._screenOffsetY;

        // Captures are always taken unflipped at scale 1.
        this.setTransform(1, false, null, null);

        this._screenOffsetX = 0;
        this._screenOffsetY = 0;

        this.render(-1, true);

        this.setDisplayMask(null);

        const bounds = this._display.getBounds();
        const texture = TextureUtils.createAndWriteRenderTexture(this._display.width, this._display.height, this._display, new Matrix(1, 0, 0, 1, -(bounds.x), -(bounds.y)));

        this.setDisplayMask(this._mask);

        this._noSpriteVisibilityChecking = false;

        this.setTransform(currentScale, currentFlipped, null, null);

        this._screenOffsetX = currentOffsetX;
        this._screenOffsetY = currentOffsetY;

        return texture;
    }

    private doMagic(): void
    {
        const geometry = (this.geometry as RoomGeometry);

        if(this._rotation !== 0)
        {
            let direction = this._effectDirection;

            geometry.direction = new Vector3d((direction.x + this._rotation), direction.y, direction.z);

            direction = (geometry.direction as Vector3d);

            geometry.setDepthVector(new Vector3d(direction.x, direction.y, 5));

            const location = new Vector3d();

            location.assign(this._rotationOrigin);

            location.x = (location.x + ((this._rotationRodLength * Math.cos((((direction.x + 180) / 180) * Math.PI))) * Math.cos(((direction.y / 180) * Math.PI))));
            location.y = (location.y + ((this._rotationRodLength * Math.sin((((direction.x + 180) / 180) * Math.PI))) * Math.cos(((direction.y / 180) * Math.PI))));
            location.z = (location.z + (this._rotationRodLength * Math.sin(((direction.y / 180) * Math.PI))));

            geometry.location = location;

            this._effectLocation = new Vector3d();
            this._effectLocation.assign(location);
            this._effectDirection = new Vector3d();
            this._effectDirection.assign(geometry.direction);
        }

        if(RoomShakingEffect.isVisualizationOn() && !this._SafeStr_4507)
        {
            this.changeShaking();
        }
        else
        {
            if(!RoomShakingEffect.isVisualizationOn() && this._SafeStr_4507) this.changeShaking();
        }

        if(RoomRotatingEffect.isVisualizationOn()) this.changeRotation();

        if(this._SafeStr_4507)
        {
            this._SafeStr_795++;

            const baseDirection = this._effectDirection;
            const direction = Vector3d.sum(baseDirection, new Vector3d((Math.sin((((this._SafeStr_795 * 5) / 180) * Math.PI)) * 2), (Math.sin(((this._SafeStr_795 / 180) * Math.PI)) * 5), (Math.sin((((this._SafeStr_795 * 10) / 180) * Math.PI)) * 2)));

            geometry.direction = direction;
        }
        else
        {
            this._SafeStr_795 = 0;

            geometry.direction = this._effectDirection;
        }
    }

    private changeShaking(): void
    {
        this._SafeStr_4507 = !this._SafeStr_4507;

        if(this._SafeStr_4507)
        {
            const direction = this.geometry.direction;

            this._effectDirection = new Vector3d(direction.x, direction.y, direction.z);
        }
    }

    private changeRotation(): void
    {
        if(this._SafeStr_4507) return;

        const geometry = (this.geometry as RoomGeometry);

        if(!geometry) return;

        if(this._rotation === 0)
        {
            const location = geometry.location;
            const directionAxis = geometry.directionAxis;

            this._effectLocation = new Vector3d();
            this._effectLocation.assign(location);
            this._effectDirection = new Vector3d();
            this._effectDirection.assign(geometry.direction);

            const intersection = RoomGeometry.getIntersectionVector(location, directionAxis, new Vector3d(0, 0, 0), new Vector3d(0, 0, 1));

            if(intersection !== null)
            {
                this._rotationOrigin = new Vector3d(intersection.x, intersection.y, intersection.z);
                this._rotationRodLength = Vector3d.dif(intersection, location).length;
                this._rotation = 1;
            }

            return;
        }

        this._rotation = 0;

        geometry.location = this._effectLocation;
        geometry.direction = this._effectDirection;
        geometry.setDepthVector(new Vector3d(this._effectDirection.x, this._effectDirection.y, 5));
    }

    public moveLeft(): void
    {
        if(this._rotation !== 0)
        {
            if(this._rotation === 1)
            {
                this._rotation = -1;
            }
            else
            {
                this._rotation = (this._rotation - 1);
            }

            return;
        }

        const geometry = (this.geometry as RoomGeometry);
        const direction = (((geometry.direction.x - 90) / 180) * Math.PI);

        geometry.location = Vector3d.sum(geometry.location, new Vector3d((Math.cos(direction) * Math.sqrt(2)), (Math.sin(direction) * Math.sqrt(2))));
    }

    public moveRight(): void
    {
        if(this._rotation !== 0)
        {
            if(this._rotation === -1)
            {
                this._rotation = 1;
            }
            else
            {
                this._rotation = (this._rotation + 1);
            }

            return;
        }

        const geometry = (this.geometry as RoomGeometry);
        const direction = (((geometry.direction.x + 90) / 180) * Math.PI);

        geometry.location = Vector3d.sum(geometry.location, new Vector3d((Math.cos(direction) * Math.sqrt(2)), (Math.sin(direction) * Math.sqrt(2))));
    }

    public moveUp(): void
    {
        if(this._rotation !== 0) return;

        const geometry = (this.geometry as RoomGeometry);
        const direction = ((geometry.direction.x / 180) * Math.PI);

        geometry.location = Vector3d.sum(geometry.location, new Vector3d((Math.cos(direction) * Math.sqrt(2)), (Math.sin(direction) * Math.sqrt(2))));
    }

    public moveDown(): void
    {
        if(this._rotation !== 0) return;

        const geometry = (this.geometry as RoomGeometry);
        const direction = (((geometry.direction.x + 180) / 180) * Math.PI);

        geometry.location = Vector3d.sum(geometry.location, new Vector3d((Math.cos(direction) * Math.sqrt(2)), (Math.sin(direction) * Math.sqrt(2))));
    }

    public get id(): number
    {
        return this._id;
    }

    public get geometry(): IRoomGeometry
    {
        return this._geometry;
    }

    public get master(): Container
    {
        return this._master;
    }

    public get display(): Container
    {
        return this._display;
    }

    public get screenOffsetX(): number
    {
        return this._screenOffsetX;
    }

    public set screenOffsetX(x: number)
    {
        x = Math.trunc(x);

        this._mouseLocation.x = (this._mouseLocation.x - (x - this._screenOffsetX));
        this._screenOffsetX = x;
    }

    public get screenOffsetY(): number
    {
        return this._screenOffsetY;
    }

    public set screenOffsetY(y: number)
    {
        y = Math.trunc(y);

        this._mouseLocation.y = (this._mouseLocation.y - (y - this._screenOffsetY));
        this._screenOffsetY = y;
    }

    public get scale(): number
    {
        return this._scale;
    }

    public get isFlipped(): boolean
    {
        return this._isFlipped;
    }

    public get width(): number
    {
        return (this._width * this._scale);
    }

    public get height(): number
    {
        return (this._height * this._scale);
    }

    public get canvasUpdated(): boolean
    {
        return this._canvasUpdated;
    }

    public set canvasUpdated(flag: boolean)
    {
        this._canvasUpdated = flag;
    }
}
