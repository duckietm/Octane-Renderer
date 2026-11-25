import { AlphaTolerance, IRoomPlaneDrawData } from '@octane/api';
import { GetRegionHitMap, GetRenderer, RegionHitMap, TextureUtils } from '@octane/utils';
import { DestroyOptions, Filter, Point, Sprite, Texture, TextureSource, WebGLRenderer, WebGPURenderer } from 'pixi.js';
import { RoomPlaneDisplay } from './RoomPlaneDisplay';
import { RoomPlaneContainsPoint } from './RoomPlaneHitTest';
import { IWiredHighlight, WiredHighlightCache } from './WiredHighlightCache';

const BYTES_PER_PIXEL = 4;

export class ExtendedSprite extends Sprite
{
    private static SCRATCH_POINT: Point = new Point();

    private _planeDisplay: RoomPlaneDisplay = null;
    private _offsetX: number = 0;
    private _offsetY: number = 0;
    private _tag: string = '';
    private _alphaTolerance: number = AlphaTolerance.MATCH_OPAQUE_PIXELS;
    private _varyingDepth: boolean = false;
    private _clickHandling: boolean = false;
    private _skipMouseHandling: boolean = false;

    private _updateId1: number = -1;
    private _updateId2: number = -1;
    private _filterSource: Filter[] = null;
    private _filtersShown: boolean = false;
    private _sourceTexture: Texture = null;
    private _highlight: IWiredHighlight = null;
    private _highlightWaitsForParents: boolean = false;

    constructor(options?: ConstructorParameters<typeof Sprite>[0])
    {
        super(options);

        this._sourceTexture = super.texture ?? null;
    }

    public needsUpdate(updateId1: number, updateId2: number): boolean
    {
        if((this._updateId1 === updateId1) && (this._updateId2 === updateId2)) return false;

        this._updateId1 = updateId1;
        this._updateId2 = updateId2;

        return true;
    }

    // Pixi copies and freezes every array handed to `filters`, so the reference a room
    // sprite gave us is remembered here to skip the copy when it has not changed.
    public setFilters(filters: Filter[]): void
    {
        if(filters === this._filterSource) return;

        this._filterSource = filters;

        if(!this._highlight) this.showFilters(true);
    }

    public setTexture(texture: Texture): void
    {
        if(!texture || texture.destroyed || !texture.source) texture = Texture.EMPTY;

        if(texture === this.sourceTexture) return;

        if(texture === Texture.EMPTY)
        {
            this._updateId1 = -1;
            this._updateId2 = -1;
        }

        this._sourceTexture = texture;
        this.showSource();
    }

    // The room sprite's own texture: hit tests and change checks use it, whatever is drawn.
    public get sourceTexture(): Texture
    {
        return this._sourceTexture ?? super.texture;
    }

    // Called once the canvas has copied a room sprite's properties. A sprite marked only by a
    // WiredFilter, drawn as is (no tint, full alpha, normal blend), shows the frame already drawn
    // through that filter instead of running the filter every frame; anything else draws as before.
    public updateHighlight(): void
    {
        const filter = WiredHighlightCache.getFilter(this._filterSource);
        const blendMode = this.blendMode;
        // Flipped or scaled sprites keep the filter: the filter pass rounds its area on the side the
        // sprite is drawn from, so a drawing flipped afterwards would differ by a column of pixels.
        const plain = (this.alpha === 1) && (this.tint === 0xFFFFFF) && ((blendMode === 'normal') || (blendMode === 'inherit'))
            && (this.scale.x === 1) && (this.scale.y === 1);
        const parentsPlain = this.hasPlainParents();

        // Held back only by a parent (zoom, flip, fade): try again once the parents are plain.
        this._highlightWaitsForParents = (!!filter && plain && !parentsPlain);

        const highlight = (filter && plain && parentsPlain) ? WiredHighlightCache.acquire(this.sourceTexture, filter) : null;

        if(!highlight)
        {
            if(this._highlight) this.showSource();

            return;
        }

        // acquire() counted it once more; keep one count per sprite.
        if(highlight === this._highlight)
        {
            WiredHighlightCache.release(highlight);

            return;
        }

        if(this._highlight) WiredHighlightCache.release(this._highlight);

        this._highlight = highlight;
        this.showFilters(false);
        this.texture = highlight.texture;
    }

    // Every frame: a drawing whose source, context or filter colours changed is redrawn in place.
    public validateHighlight(): void
    {
        if(!this._highlight)
        {
            if(this._highlightWaitsForParents && this.hasPlainParents()) this.updateHighlight();

            return;
        }

        // A parent's alpha, tint, zoom, flip or rotation reaches the filter's input but would only reach
        // the drawing after it.
        if(!this.hasPlainParents())
        {
            this.showSource();

            this._highlightWaitsForParents = true;

            return;
        }

        WiredHighlightCache.validate(this._highlight);
    }

    public get hasHighlight(): boolean
    {
        return !!this._highlight;
    }

    private hasPlainParents(): boolean
    {
        for(let parent = this.parent; parent; parent = parent.parent)
        {
            if((parent.alpha !== 1) || (parent.tint !== 0xFFFFFF)) return false;

            if((parent.scale.x !== 1) || (parent.scale.y !== 1) || (parent.rotation !== 0) || (parent.skew.x !== 0) || (parent.skew.y !== 0)) return false;
        }

        return true;
    }

    private showSource(): void
    {
        if(this._highlight)
        {
            WiredHighlightCache.release(this._highlight);

            this._highlight = null;
        }

        this.texture = this.sourceTexture;
        this.showFilters(true);
    }

    private showFilters(show: boolean): void
    {
        if(show)
        {
            if(!this._filtersShown && !this._filterSource?.length) return;

            this.filters = this._filterSource;
            this._filtersShown = !!this._filterSource?.length;

            return;
        }

        if(!this._filtersShown) return;

        this.filters = null;
        this._filtersShown = false;
    }

    // A pooled or asset texture can be destroyed while this sprite still sits in the
    // display list (TexturePool overflow, RoomPlane / AvatarImage disposal). Pixi would
    // then batch a texture without a source, so drop it here, in the same call that
    // destroys it, and let the next render pass pick up whatever the room sprite holds.
    public override get texture(): Texture
    {
        return super.texture;
    }

    public override set texture(texture: Texture)
    {
        const previous = super.texture;

        if(previous && (previous !== texture)) ExtendedSprite.unwatchTexture(previous, this);

        super.texture = texture;

        const current = super.texture;

        if(current && (current !== previous) && (current !== Texture.EMPTY)) ExtendedSprite.watchTexture(current, this);
    }

    // Thousands of room sprites can share one texture, and an emitter rebuilds its whole
    // listener list on every off(). One listener per texture keeps each sprite's watch O(1).
    private static TEXTURE_SPRITES: WeakMap<Texture, Set<ExtendedSprite>> = new WeakMap();

    private static watchTexture(texture: Texture, sprite: ExtendedSprite): void
    {
        let sprites = ExtendedSprite.TEXTURE_SPRITES.get(texture);

        if(!sprites)
        {
            sprites = new Set();

            ExtendedSprite.TEXTURE_SPRITES.set(texture, sprites);
            texture.on('destroy', ExtendedSprite.onSharedTextureDestroyed);
        }

        sprites.add(sprite);
    }

    private static unwatchTexture(texture: Texture, sprite: ExtendedSprite): void
    {
        const sprites = ExtendedSprite.TEXTURE_SPRITES.get(texture);

        if(!sprites?.delete(sprite) || sprites.size) return;

        ExtendedSprite.TEXTURE_SPRITES.delete(texture);
        texture.off('destroy', ExtendedSprite.onSharedTextureDestroyed);
    }

    // Like the emitter it replaces: every sprite watching when the texture is destroyed is
    // told, in the order it started watching, even if an earlier one stops watching meanwhile.
    private static onSharedTextureDestroyed(texture: Texture): void
    {
        const sprites = ExtendedSprite.TEXTURE_SPRITES.get(texture);

        if(!sprites) return;

        ExtendedSprite.TEXTURE_SPRITES.delete(texture);

        for(const sprite of [ ...sprites ]) sprite.onTextureDestroyed(texture);
    }

    private onTextureDestroyed(texture: Texture): void
    {
        if(texture && this._highlight && (texture === this._highlight.texture))
        {
            // The drawn highlight went away (cache trim, context loss, its source destroyed): draw
            // the frame through the filter again and let the next update draw a new one.
            this._updateId1 = -1;
            this._updateId2 = -1;

            const sourceTexture = this.sourceTexture;

            if(!sourceTexture || sourceTexture.destroyed || !sourceTexture.source || sourceTexture.source.destroyed) this._sourceTexture = Texture.EMPTY;

            this.showSource();

            return;
        }

        this._sourceTexture = null;
        this.setTexture(null);
    }

    public override destroy(options?: DestroyOptions): void
    {
        this.setPlaneDrawData(null);

        if(super.texture) ExtendedSprite.unwatchTexture(super.texture, this);

        if(this._highlight)
        {
            WiredHighlightCache.release(this._highlight);

            this._highlight = null;
        }

        super.destroy(options);
    }

    // A room plane drawn from its tile (room.planes.direct): a RoomPlaneDisplay child draws it, so this
    // sprite's tint, alpha, filters and position apply to it unchanged. Null removes the display.
    public setPlaneDrawData(data: IRoomPlaneDrawData): void
    {
        if(!data)
        {
            if(this._planeDisplay)
            {
                this._planeDisplay.destroy();

                this._planeDisplay = null;
            }

            return;
        }

        if(!this._planeDisplay)
        {
            this.allowChildren = true;
            this._planeDisplay = new RoomPlaneDisplay();

            this.addChild(this._planeDisplay);
        }

        this._planeDisplay.setData(data);
    }

    public get planeDrawData(): IRoomPlaneDrawData
    {
        return (this._planeDisplay ? this._planeDisplay.data : null);
    }

    public containsPoint(point: Point): boolean
    {
        if(point && this._planeDisplay) return RoomPlaneContainsPoint(this._planeDisplay.data, (point.x * this.scale.x), (point.y * this.scale.y), this.alphaTolerance);

        const texture = this.sourceTexture;

        if(!point || (this.alphaTolerance > 255) || !texture || (texture === Texture.EMPTY)) return false;

        point = ExtendedSprite.SCRATCH_POINT.set((point.x * this.scale.x), (point.y * this.scale.y));

        if(!super.containsPoint(point)) return false;

        // An avatar atlas cell keeps a hit map of its own rectangle (ported from plus-emulator/volt-renderer, by Dennis, GPL-3.0).
        const region = GetRegionHitMap(texture);

        if(region) return ExtendedSprite.regionContainsPoint(texture, region, point, this.alphaTolerance);

        const textureSource = texture.source;

        if((!textureSource || !textureSource.hitMap) && !ExtendedSprite.generateHitMapForTextureSource(textureSource)) return false;

        if(textureSource.hitMapDirty && ((Date.now() - (textureSource.hitMapTime ?? 0)) > 100)) ExtendedSprite.generateHitMapForTextureSource(textureSource);

        const hitMap = (textureSource.hitMap as Uint8Array);

        if(!hitMap) return false;

        let dx = (point.x + texture.frame.x);
        let dy = (point.y + texture.frame.y);

        if(texture.trim)
        {
            dx -= texture.trim.x;
            dy -= texture.trim.y;
        }

        dx = (Math.round(dx) * textureSource.resolution);
        dy = (Math.round(dy) * textureSource.resolution);

        const index = (dx + dy * textureSource.width) * 4;

        return (hitMap[index + 3] >= this.alphaTolerance);
    }

    private static regionContainsPoint(texture: Texture, region: RegionHitMap, point: Point, alphaTolerance: number): boolean
    {
        if((!region.pixels || (region.dirty && ((Date.now() - region.time) > 100))) && !ExtendedSprite.readRegionHitMap(texture, region)) return false;

        const resolution = texture.source.resolution;
        const width = Math.max(Math.round(texture.frame.width * resolution), 1);
        const height = Math.max(Math.round(texture.frame.height * resolution), 1);
        const dx = (Math.round(point.x) * resolution);
        const dy = (Math.round(point.y) * resolution);

        if((dx < 0) || (dy < 0) || (dx >= width) || (dy >= height)) return false;

        return (region.pixels[((dx + dy * width) * 4) + 3] >= alphaTolerance);
    }

    // Reads back only the region's rectangle of its render target.
    private static readRegionHitMap(texture: Texture, region: RegionHitMap): boolean
    {
        const textureSource = texture.source;
        const renderer = GetRenderer();

        if(!textureSource || !(renderer instanceof WebGLRenderer))
        {
            const pixels = TextureUtils.getPixels(texture)?.pixels ?? null;

            if(!pixels) return false;

            region.pixels = pixels;
        }
        else
        {
            const resolution = textureSource.resolution;
            const width = Math.max(Math.round(texture.frame.width * resolution), 1);
            const height = Math.max(Math.round(texture.frame.height * resolution), 1);
            const gl = renderer.gl;
            const framebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
            const adaptor = renderer.renderTarget.adaptor;

            if(!region.pixels || (region.pixels.length !== (BYTES_PER_PIXEL * width * height))) region.pixels = new Uint8ClampedArray(BYTES_PER_PIXEL * width * height);

            try
            {
                const renderTarget = renderer.renderTarget.getRenderTarget(textureSource);
                const glRenderTarget = renderer.renderTarget.getGpuRenderTarget(renderTarget);

                adaptor.bindFramebuffer(glRenderTarget.resolveTargetFramebuffer);

                gl.readPixels(Math.round(texture.frame.x * resolution), Math.round(texture.frame.y * resolution), width, height, gl.RGBA, gl.UNSIGNED_BYTE, region.pixels);
            }
            finally
            {
                adaptor.bindFramebuffer(framebuffer);
            }
        }

        region.dirty = false;
        region.time = Date.now();

        return true;
    }

    private static generateHitMapForTextureSource(textureSource: TextureSource): boolean
    {
        if(!textureSource) return false;

        const renderer = GetRenderer();
        const width = Math.max(Math.round(textureSource.width * textureSource.resolution), 1);
        const height = Math.max(Math.round(textureSource.height * textureSource.resolution), 1);

        let pixels: Uint8ClampedArray = ExtendedSprite.getImagePixels(textureSource, width, height);

        if(pixels)
        {
            // Read from the decoded image itself, no GPU round trip.
        }

        else if(renderer instanceof WebGPURenderer)
        {
            pixels = TextureUtils.getPixels(new Texture(textureSource))?.pixels ?? null;
        }

        else if(renderer instanceof WebGLRenderer)
        {
            pixels = new Uint8ClampedArray(BYTES_PER_PIXEL * width * height);

            const gl = renderer.gl;
            const adaptor = renderer.renderTarget.adaptor;
            const framebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;

            // Bind through the adaptor: it caches the bound framebuffer, and a raw
            // gl.bindFramebuffer would leave the next draw on the hit-test target.
            try
            {
                const renderTarget = renderer.renderTarget.getRenderTarget(textureSource);
                const glRenderTarget = renderer.renderTarget.getGpuRenderTarget(renderTarget);

                adaptor.bindFramebuffer(glRenderTarget.resolveTargetFramebuffer);

                gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            }
            finally
            {
                adaptor.bindFramebuffer(framebuffer);
            }
        }

        if(!pixels) return false;

        textureSource.hitMap = pixels;
        textureSource.hitMapDirty = false;
        textureSource.hitMapTime = Date.now();

        return true;
    }

    // A decoded image still holds its pixels on the CPU. Reading them there spares the GPU
    // read back, which waits for every queued frame. Render textures (avatars, palette
    // results) and other sources still go through the GPU.
    private static getImagePixels(textureSource: TextureSource, width: number, height: number): Uint8ClampedArray
    {
        const resource = textureSource.resource;

        let image: ImageBitmap | HTMLImageElement = null;
        let imageWidth = 0;
        let imageHeight = 0;

        if((typeof ImageBitmap !== 'undefined') && (resource instanceof ImageBitmap))
        {
            image = resource;
            imageWidth = resource.width;
            imageHeight = resource.height;
        }

        else if((typeof HTMLImageElement !== 'undefined') && (resource instanceof HTMLImageElement))
        {
            image = resource;
            imageWidth = resource.naturalWidth;
            imageHeight = resource.naturalHeight;
        }

        if(!image || (typeof OffscreenCanvas === 'undefined')) return null;

        // The hit map is indexed in texture pixels; an image of another size would not line up.
        if((imageWidth !== width) || (imageHeight !== height)) return null;

        try
        {
            const context = new OffscreenCanvas(width, height).getContext('2d', { willReadFrequently: true });

            if(!context) return null;

            context.drawImage(image, 0, 0);

            return context.getImageData(0, 0, width, height).data;
        }
        catch
        {
            // A closed bitmap or a cross-origin image: the GPU path tries instead.
            return null;
        }
    }

    public get offsetX(): number
    {
        return this._offsetX;
    }

    public set offsetX(offset: number)
    {
        this._offsetX = offset;
    }

    public get offsetY(): number
    {
        return this._offsetY;
    }

    public set offsetY(offset: number)
    {
        this._offsetY = offset;
    }

    public get tag(): string
    {
        return this._tag;
    }

    public set tag(tag: string)
    {
        this._tag = tag;
    }

    public get alphaTolerance(): number
    {
        return this._alphaTolerance;
    }

    public set alphaTolerance(tolerance: number)
    {
        this._alphaTolerance = tolerance;
    }

    public get varyingDepth(): boolean
    {
        return this._varyingDepth;
    }

    public set varyingDepth(flag: boolean)
    {
        this._varyingDepth = flag;
    }

    public get clickHandling(): boolean
    {
        return this._clickHandling;
    }

    public set clickHandling(flag: boolean)
    {
        this._clickHandling = flag;
    }

    public get skipMouseHandling(): boolean
    {
        return this._skipMouseHandling;
    }

    public set skipMouseHandling(flag: boolean)
    {
        this._skipMouseHandling = flag;
    }
}
