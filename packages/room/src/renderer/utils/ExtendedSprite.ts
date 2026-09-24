import { AlphaTolerance } from '@octane/api';
import { GetRenderer, TextureUtils } from '@octane/utils';
import { DestroyOptions, Filter, Point, Sprite, Texture, TextureSource, WebGLRenderer, WebGPURenderer } from 'pixi.js';

const BYTES_PER_PIXEL = 4;

export class ExtendedSprite extends Sprite
{
    private static SCRATCH_POINT: Point = new Point();

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
    private _watchedTexture: Texture = null;

    constructor(options?: ConstructorParameters<typeof Sprite>[0])
    {
        super(options);

        this.watchTexture(this.texture);
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
        this.filters = filters;
    }

    public setTexture(texture: Texture): void
    {
        if(!texture || texture.destroyed || !texture.source) texture = Texture.EMPTY;

        if(texture !== this.texture)
        {
            if(texture === Texture.EMPTY)
            {
                this._updateId1 = -1;
                this._updateId2 = -1;
            }

            this.texture = texture;
        }

        this.watchTexture(texture);
    }

    public destroy(options?: Parameters<Sprite['destroy']>[0]): void
    {
        this.watchTexture(null);

        super.destroy(options);
    }

    // A texture destroyed while a sprite still shows it would leave the sprite pointing at
    // released GPU memory: the sprite listens for that and falls back to the empty texture.
    // Texture.EMPTY is shared and never destroyed, so it is never subscribed to.
    private watchTexture(texture: Texture): void
    {
        const watched = ((texture && (texture !== Texture.EMPTY)) ? texture : null);

        if(watched === this._watchedTexture) return;

        if(this._watchedTexture) this._watchedTexture.off('destroy', this.onWatchedTextureDestroyed, this);

        this._watchedTexture = watched;

        if(this._watchedTexture) this._watchedTexture.on('destroy', this.onWatchedTextureDestroyed, this);
    }

    private onWatchedTextureDestroyed(texture: Texture): void
    {
        if(texture === this.texture)
        {
            this.setTexture(Texture.EMPTY);

            return;
        }

        this.watchTexture(this.texture);
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

        if(previous && (previous !== texture)) previous.off('destroy', this.onTextureDestroyed, this);

        super.texture = texture;

        const current = super.texture;

        if(current && (current !== previous) && (current !== Texture.EMPTY)) current.on('destroy', this.onTextureDestroyed, this);
    }

    private onTextureDestroyed(): void
    {
        this.setTexture(null);
    }

    public override destroy(options?: DestroyOptions): void
    {
        super.texture?.off('destroy', this.onTextureDestroyed, this);

        super.destroy(options);
    }

    public containsPoint(point: Point): boolean
    {
        if(!point || (this.alphaTolerance > 255) || !this.texture || (this.texture === Texture.EMPTY)) return false;

        point = ExtendedSprite.SCRATCH_POINT.set((point.x * this.scale.x), (point.y * this.scale.y));

        if(!super.containsPoint(point)) return false;

        const texture = this.texture;
        const textureSource = this.texture.source;

        if((!textureSource || !textureSource.hitMap) && !ExtendedSprite.generateHitMapForTextureSource(textureSource)) return false;

        if(textureSource.hitMapDirty && ((Date.now() - (textureSource.hitMapTime ?? 0)) > 100)) ExtendedSprite.generateHitMapForTextureSource(textureSource);

        const hitMap = (textureSource.hitMap as Uint8Array);

        if(!hitMap) return false;

        let dx = (point.x + texture.frame.x);
        let dy = (point.y + texture.frame.y);

        if(this.texture.trim)
        {
            dx -= texture.trim.x;
            dy -= texture.trim.y;
        }

        dx = (Math.round(dx) * textureSource.resolution);
        dy = (Math.round(dy) * textureSource.resolution);

        const index = (dx + dy * textureSource.width) * 4;

        return (hitMap[index + 3] >= this.alphaTolerance);
    }

    private static generateHitMapForTextureSource(textureSource: TextureSource): boolean
    {
        if(!textureSource) return false;

        const renderer = GetRenderer();
        const width = Math.max(Math.round(textureSource.width * textureSource.resolution), 1);
        const height = Math.max(Math.round(textureSource.height * textureSource.resolution), 1);

        let pixels: Uint8ClampedArray = null;

        if(renderer instanceof WebGPURenderer)
        {
            pixels = TextureUtils.getPixels(new Texture(textureSource))?.pixels ?? null;
        }

        else if(renderer instanceof WebGLRenderer)
        {
            pixels = new Uint8ClampedArray(BYTES_PER_PIXEL * width * height);

            const webglRenderer = renderer;
            const renderTarget = webglRenderer.renderTarget.getRenderTarget(textureSource);
            const glRenderTarget = webglRenderer.renderTarget.getGpuRenderTarget(renderTarget);

            const gl = webglRenderer.gl;

            gl.bindFramebuffer(gl.FRAMEBUFFER, glRenderTarget.resolveTargetFramebuffer);

            gl.readPixels(
                0,
                0,
                width,
                height,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                pixels
            );
        }

        if(!pixels) return false;

        textureSource.hitMap = pixels;
        textureSource.hitMapDirty = false;
        textureSource.hitMapTime = Date.now();

        return true;
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
