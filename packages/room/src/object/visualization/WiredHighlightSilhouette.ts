import { AlphaTolerance, IRoomObjectSprite } from '@octane/api';
import { GetRenderer } from '@octane/utils';
import { ColorMatrixFilter, Container, Filter, RenderTexture, Renderer, Sprite, Texture } from 'pixi.js';
import { RoomObjectSprite } from './RoomObjectSprite';

/** AIR's composite highlight sprite: 32 px around the silhouette for the glow, one depth step behind the object. */
export const WIRED_HIGHLIGHT_PADDING = 32;
export const WIRED_HIGHLIGHT_DEPTH_STEP = 0.0005;
export const WIRED_HIGHLIGHT_TAG = 'wired_highlight';

/** A sprite that may feed the silhouette: visible, drawn, not see-through and not additive (AIR's sources). */
export const isWiredHighlightSource = (sprite: IRoomObjectSprite): boolean =>
{
    if(!sprite || !sprite.visible || (sprite.alpha <= 0) || (sprite.blendMode === 'add')) return false;

    const texture = sprite.texture;

    return !!texture && !texture.destroyed && !!texture.source && (texture !== Texture.EMPTY) && (texture.width > 0) && (texture.height > 0);
};

interface SourceState
{
    sprite: IRoomObjectSprite;
    texture: Texture;
    offsetX: number;
    offsetY: number;
    flipH: boolean;
    flipV: boolean;
    scale: number;
}

const NO_FILTERS: Filter[] = [];

const roundUp = (value: number): number => Math.max(WIRED_HIGHLIGHT_PADDING, Math.ceil(value / WIRED_HIGHLIGHT_PADDING) * WIRED_HIGHLIGHT_PADDING);

// Every drawn pixel becomes opaque black (AIR's threshold over the composite bitmap).
const createSilhouetteFilter = (): ColorMatrixFilter =>
{
    const filter = new ColorMatrixFilter();

    filter.matrix = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 0 ];

    return filter;
};

/**
 * The wired outline, soft glow and neon aura as AIR draws them: the object's sprites are drawn once into a black
 * silhouette, each glow filter runs over it on its own and the results stack, and the glow shows through one extra
 * sprite just behind the object, so the object itself stays visible on top.
 */
export class WiredHighlightSilhouette
{
    private _sprite: RoomObjectSprite = new RoomObjectSprite();
    private _silhouette: RenderTexture = null;
    private _glow: RenderTexture = null;
    private _sources: SourceState[] = [];
    private _filters: Filter[] = null;
    private _silhouetteFilter: ColorMatrixFilter = null;
    private _renderer: Renderer = null;
    private _contextLost: boolean = false;
    private _contextListener = {
        contextChange: (): void =>
        {
            this._contextLost = true;
        }
    };

    constructor()
    {
        this._sprite.visible = false;
    }

    public get sprite(): IRoomObjectSprite
    {
        return this._sprite;
    }

    /** Draws the glow of `sources` with `filters` (null clears it). True when the sprite changed. */
    public update(sources: IRoomObjectSprite[], filters: Filter[], alpha: number, force: boolean = false): boolean
    {
        if(!filters || !filters.length)
        {
            const wasVisible = this._sprite.visible;

            this.clear(false);

            return wasVisible;
        }

        const drawn = (sources || []).filter(isWiredHighlightSource);
        const renderer = GetRenderer();

        if(!drawn.length || (alpha <= 0) || !renderer) return this.hide();

        this.watchRenderer(renderer);

        let left = Infinity;
        let top = Infinity;
        let right = -Infinity;
        let bottom = -Infinity;
        let depth = -Infinity;

        for(const sprite of drawn)
        {
            const scale = (sprite.scale > 0) ? sprite.scale : 1;
            const width = sprite.texture.width * scale;
            const height = sprite.texture.height * scale;
            const x = sprite.flipH ? (sprite.offsetX - width) : sprite.offsetX;
            const y = sprite.flipV ? (sprite.offsetY - height) : sprite.offsetY;

            left = Math.min(left, x);
            top = Math.min(top, y);
            right = Math.max(right, x + width);
            bottom = Math.max(bottom, y + height);
            depth = Math.max(depth, sprite.relativeDepth);
        }

        left = Math.floor(left);
        top = Math.floor(top);

        const rebuild = force || this._contextLost || this.sourcesChanged(drawn);
        const redraw = rebuild || (filters !== this._filters);

        if(rebuild)
        {
            const width = Math.ceil(right - left) + (WIRED_HIGHLIGHT_PADDING * 2);
            const height = Math.ceil(bottom - top) + (WIRED_HIGHLIGHT_PADDING * 2);

            this._silhouette = this.fit(this._silhouette, width, height);
            this.drawSilhouette(renderer, drawn, left, top);
            this._sources = drawn.map(sprite => ({
                sprite,
                texture: sprite.texture,
                offsetX: sprite.offsetX,
                offsetY: sprite.offsetY,
                flipH: sprite.flipH,
                flipV: sprite.flipV,
                scale: sprite.scale
            }));
            this._contextLost = false;
        }

        if(redraw)
        {
            const resized = !this._glow || (this._glow.width !== this._silhouette.width) || (this._glow.height !== this._silhouette.height);

            this._glow = this.fit(this._glow, this._silhouette.width, this._silhouette.height);
            this.drawGlow(renderer, filters);
            this._filters = filters;

            // A texture resized in place: set it again so the sprite takes its new size.
            if(resized) this._sprite.texture = Texture.EMPTY;
        }

        const sprite = this._sprite;

        sprite.texture = this._glow;
        sprite.tag = WIRED_HIGHLIGHT_TAG;
        sprite.blendMode = 'normal';
        sprite.color = 0xFFFFFF;
        sprite.filters = NO_FILTERS;
        sprite.flipH = false;
        sprite.flipV = false;
        sprite.scale = 1;
        sprite.alphaTolerance = AlphaTolerance.MATCH_NOTHING;
        sprite.clickHandling = false;
        sprite.skipMouseHandling = true;
        sprite.varyingDepth = false;
        sprite.offsetX = left - WIRED_HIGHLIGHT_PADDING;
        sprite.offsetY = top - WIRED_HIGHLIGHT_PADDING;
        sprite.relativeDepth = depth + WIRED_HIGHLIGHT_DEPTH_STEP;
        sprite.alpha = Math.max(0, Math.min(255, Math.round(alpha)));

        const changed = redraw || !sprite.visible;

        sprite.visible = true;

        return changed;
    }

    /** Hides the glow; with `disposeTextures` its drawings are freed too. */
    public clear(disposeTextures: boolean): void
    {
        this._sprite.visible = false;
        this._sources = [];
        this._filters = null;

        if(!disposeTextures) return;

        this._sprite.texture = null;
        this._silhouette?.destroy(true);
        this._glow?.destroy(true);
        this._silhouette = null;
        this._glow = null;
    }

    public dispose(): void
    {
        this.clear(true);
        this._silhouetteFilter?.destroy();
        this._silhouetteFilter = null;

        try
        {
            this._renderer?.runners?.contextChange?.remove(this._contextListener);
        }
        catch
        {
            // A destroyed renderer has no runners left to leave.
        }

        this._renderer = null;
    }

    private hide(): boolean
    {
        const wasVisible = this._sprite.visible;

        this._sprite.visible = false;

        return wasVisible;
    }

    private sourcesChanged(sources: IRoomObjectSprite[]): boolean
    {
        if(sources.length !== this._sources.length) return true;

        return sources.some((sprite, index) =>
        {
            const last = this._sources[index];

            return (last.sprite !== sprite) || (last.texture !== sprite.texture) || (last.offsetX !== sprite.offsetX) || (last.offsetY !== sprite.offsetY)
                || (last.flipH !== sprite.flipH) || (last.flipV !== sprite.flipV) || (last.scale !== sprite.scale);
        });
    }

    // The textures only grow, in steps of 32 px, so a moving or animating object does not reallocate every frame.
    private fit(texture: RenderTexture, width: number, height: number): RenderTexture
    {
        const fitWidth = roundUp(width);
        const fitHeight = roundUp(height);

        if(!texture || texture.destroyed) return RenderTexture.create({ width: fitWidth, height: fitHeight, resolution: 1, scaleMode: 'nearest' });

        if((texture.width < fitWidth) || (texture.height < fitHeight)) texture.source.resize(Math.max(texture.width, fitWidth), Math.max(texture.height, fitHeight), 1);

        return texture;
    }

    private drawSilhouette(renderer: Renderer, sources: IRoomObjectSprite[], left: number, top: number): void
    {
        if(!this._silhouetteFilter) this._silhouetteFilter = createSilhouetteFilter();

        const container = new Container();

        for(const source of sources)
        {
            const scale = (source.scale > 0) ? source.scale : 1;
            const child = new Sprite(source.texture);

            child.scale.set(source.flipH ? -scale : scale, source.flipV ? -scale : scale);
            child.position.set(source.offsetX - left + WIRED_HIGHLIGHT_PADDING, source.offsetY - top + WIRED_HIGHLIGHT_PADDING);
            container.addChild(child);
        }

        container.filters = [ this._silhouetteFilter ];

        renderer.render({ container, target: this._silhouette, clear: true });

        // Leave the object's textures alone: only the throwaway sprites go.
        for(const child of container.children) (child as Sprite).texture = Texture.EMPTY;

        container.filters = null;
        container.destroy({ children: true });
    }

    private drawGlow(renderer: Renderer, filters: Filter[]): void
    {
        const sprite = new Sprite(this._silhouette);

        filters.forEach((filter, index) =>
        {
            sprite.filters = [ filter ];
            renderer.render({ container: sprite, target: this._glow, clear: (index === 0) });
        });

        sprite.filters = null;
        sprite.texture = Texture.EMPTY;
        sprite.destroy();
    }

    private watchRenderer(renderer: Renderer): void
    {
        if(this._renderer === renderer) return;

        if(this._renderer)
        {
            try
            {
                this._renderer.runners?.contextChange?.remove(this._contextListener);
            }
            catch
            {
                // A destroyed renderer has no runners left to leave.
            }

            this._contextLost = true;
        }

        this._renderer = renderer;
        renderer.runners?.contextChange?.add(this._contextListener);
    }
}
