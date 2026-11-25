// Ported from plus-emulator/volt-renderer (by Dennis, GPL-3.0).
import { GetRenderer, MarkRegionHitMapDirty, RegisterRegionHitMap, UnregisterRegionHitMap } from '@octane/utils';
import { Container, Rectangle, Renderer, RenderTexture, Texture, WebGLRenderer } from 'pixi.js';
import { AvatarAtlasGl } from './AvatarAtlasGl';
import { AvatarAtlasBatch, AvatarAtlasQuad, EnsureAvatarAtlasBatchPipe } from './AvatarAtlasBatch';
import { AvatarPartLayer } from '../AvatarImageBodyPartContainer';

export type AvatarAtlasPart = { part: { readonly layers: AvatarPartLayer[] }; x: number; y: number };

export interface IAvatarAtlasOwner
{
    // The page lost its pixels (context loss); the owner must composite again.
    onAtlasContentLost(): void;
}

export class AvatarAtlasSlot
{
    public pending: AvatarAtlasPart[] = null;
    public pendingCount: number = 0;
    // Pixels this slot counts against the cap for cached avatar frames (0 for an avatar's own cell).
    public framePixels: number = 0;
    // A part was gone by the time the cell was drawn: the picture is not whole.
    public incomplete: boolean = false;

    constructor(
        public readonly page: AvatarAtlasPage,
        public readonly cell: number,
        public readonly x: number,
        public readonly y: number,
        public readonly texture: Texture,
        public owner: IAvatarAtlasOwner)
    {}
}

class AvatarAtlasPage
{
    public readonly texture: RenderTexture;
    public readonly slots: AvatarAtlasSlot[] = [];
    public readonly pending: AvatarAtlasSlot[] = [];
    private readonly _free: number[] = [];
    private readonly _columns: number;
    private _used: number = 0;

    constructor(
        public readonly width: number,
        public readonly height: number,
        size: number)
    {
        // A transparent gutter keeps linear sampling at the edges of a zoomed avatar off its neighbours.
        const cellWidth = (width + AvatarAtlasCompositor.GUTTER * 2);
        const cellHeight = (height + AvatarAtlasCompositor.GUTTER * 2);

        this._columns = Math.max(1, Math.floor(size / cellWidth));

        const rows = Math.max(1, Math.floor(size / cellHeight));
        const count = (this._columns * rows);

        this.texture = RenderTexture.create({ width: Math.min(size, this._columns * cellWidth), height: Math.min(size, rows * cellHeight) });

        for(let cell = count - 1; cell >= 0; cell--) this._free.push(cell);
    }

    public get full(): boolean
    {
        return !this._free.length;
    }

    public get empty(): boolean
    {
        return !this._used;
    }

    public allocate(owner: IAvatarAtlasOwner): AvatarAtlasSlot
    {
        if(!this._free.length) return null;

        const cell = this._free.pop();
        const cellX = ((cell % this._columns) * (this.width + AvatarAtlasCompositor.GUTTER * 2));
        const cellY = (Math.floor(cell / this._columns) * (this.height + AvatarAtlasCompositor.GUTTER * 2));
        const x = (cellX + AvatarAtlasCompositor.GUTTER);
        const y = (cellY + AvatarAtlasCompositor.GUTTER);
        const texture = new Texture({ source: this.texture.source, frame: new Rectangle(x, y, this.width, this.height) });
        const slot = new AvatarAtlasSlot(this, cell, x, y, texture, owner);

        RegisterRegionHitMap(texture);

        this.slots[cell] = slot;
        this._used++;

        return slot;
    }

    public release(slot: AvatarAtlasSlot): void
    {
        if(this.slots[slot.cell] !== slot) return;

        this.slots[slot.cell] = undefined;
        this._free.push(slot.cell);
        this._used--;

        UnregisterRegionHitMap(slot.texture);
        slot.texture.destroy(false);
        slot.owner = null;
    }

    public destroy(): void
    {
        this.texture.destroy(true);
    }
}

/**
 * Avatars whose figure nobody else wears get one cell of a shared atlas page instead of a render
 * texture of their own. Every avatar that changed this frame is drawn into its cell by one render
 * call per page, just before the room is drawn: one framebuffer bind and a few batched draws,
 * instead of a separate render pass (with its own render group and vertex arrays) per avatar.
 * The room then batches avatars that share a page as well.
 */
export class AvatarAtlasCompositor
{
    public static GUTTER: number = 1;
    // Draw cells with plain WebGL2 when it is there; Pixi's batcher (WebGL1, WebGPU) otherwise.
    public static USE_GL: boolean = true;
    // Cached avatar frames (a walk cycle, a standing pose) may use this many atlas pixels: 256 MB.
    public static MAX_FRAME_PIXELS: number = (64 * 1024 * 1024);
    private static PAGE_SIZE: number = 2048;

    private _pages: Map<string, AvatarAtlasPage[]> = new Map();
    private _dirtyPages: Set<AvatarAtlasPage> = new Set();
    private _root: Container = new Container();
    private _batch: AvatarAtlasBatch = new AvatarAtlasBatch();
    private _quads: AvatarAtlasQuad[] = [];
    private _gl: AvatarAtlasGl = null;
    private _glRenderer: Renderer = null;
    private _renderer: Renderer = null;
    private _flushing: boolean = false;
    private _lastFlushMs: number = 0;
    private _lastFlushJobs: number = 0;
    private _flushJobs: number = 0;
    private _framePixels: number = 0;
    // While the atlas is on, one empty page per size stays for the next avatar; off, every empty page goes.
    private _keepEmptyPages: boolean = true;

    constructor()
    {
        this._root.addChild(this._batch);
    }

    private syncRenderer(): void
    {
        const renderer = GetRenderer();

        if(renderer === this._renderer) return;

        this._renderer?.runners.contextChange?.remove(this);
        this._renderer = renderer;
        this._renderer?.runners.contextChange?.add(this);

        if(this._renderer) EnsureAvatarAtlasBatchPipe(this._renderer);
    }

    public allocate(width: number, height: number, owner: IAvatarAtlasOwner): AvatarAtlasSlot
    {
        width = Math.ceil(width);
        height = Math.ceil(height);

        const cellSize = Math.max((width + AvatarAtlasCompositor.GUTTER * 2), (height + AvatarAtlasCompositor.GUTTER * 2));

        if(cellSize > AvatarAtlasCompositor.PAGE_SIZE || width < 1 || height < 1) return null;

        this.syncRenderer();

        const key = `${ width }x${ height }`;

        let pages = this._pages.get(key);

        if(!pages)
        {
            pages = [];
            this._pages.set(key, pages);
        }

        for(const page of pages)
        {
            if(!page.full) return page.allocate(owner);
        }

        const page = new AvatarAtlasPage(width, height, AvatarAtlasCompositor.PAGE_SIZE);

        pages.push(page);

        return page.allocate(owner);
    }

    // A cell for a finished frame the avatar keeps, or null once the frames use their whole share.
    public allocateFrame(width: number, height: number, owner: IAvatarAtlasOwner): AvatarAtlasSlot
    {
        const pixels = (Math.ceil(width) * Math.ceil(height));

        if((this._framePixels + pixels) > AvatarAtlasCompositor.MAX_FRAME_PIXELS) return null;

        const slot = this.allocate(width, height, owner);

        if(!slot) return null;

        slot.framePixels = pixels;
        this._framePixels += pixels;

        return slot;
    }

    public release(slot: AvatarAtlasSlot): void
    {
        if(!slot) return;

        this.cancel(slot);

        if(slot.framePixels)
        {
            this._framePixels -= slot.framePixels;
            slot.framePixels = 0;
        }

        const page = slot.page;

        page.release(slot);

        if(!page.empty) return;

        // Keep one page per size; drop the extra ones once their last avatar left.
        const key = `${ page.width }x${ page.height }`;
        const pages = this._pages.get(key);

        if(!pages || (this._keepEmptyPages && (pages.length < 2))) return;

        pages.splice(pages.indexOf(page), 1);
        this._dirtyPages.delete(page);
        page.destroy();
    }

    // The parts are drawn at the next flush; until then they must stay alive and unchanged.
    public queue(slot: AvatarAtlasSlot, parts: AvatarAtlasPart[], count: number): void
    {
        if(!slot || slot.page.slots[slot.cell] !== slot) return;

        if(!slot.pending) slot.page.pending.push(slot);

        slot.pending = parts;
        slot.pendingCount = count;

        this._dirtyPages.add(slot.page);
    }

    public cancel(slot: AvatarAtlasSlot): void
    {
        if(!slot || !slot.pending) return;

        slot.pending = null;
        slot.pendingCount = 0;

        const pending = slot.page.pending;
        const index = pending.indexOf(slot);

        if(index >= 0) pending.splice(index, 1);
    }

    // Called when the atlas is switched on or off. Off drops the pages nobody uses now, and each other
    // page as its last avatar leaves.
    public setKeepEmptyPages(keep: boolean): void
    {
        this._keepEmptyPages = keep;

        if(keep) return;

        for(const [ key, pages ] of this._pages)
        {
            for(let index = (pages.length - 1); index >= 0; index--)
            {
                const page = pages[index];

                if(!page.empty) continue;

                pages.splice(index, 1);
                this._dirtyPages.delete(page);
                page.destroy();
            }

            if(!pages.length) this._pages.delete(key);
        }
    }

    public get hasPending(): boolean
    {
        return (this._dirtyPages.size > 0);
    }

    public get lastFlushMs(): number
    {
        return this._lastFlushMs;
    }

    public get lastFlushJobs(): number
    {
        return this._lastFlushJobs;
    }

    public flush(): void
    {
        if(!this._dirtyPages.size || this._flushing)
        {
            if(!this._flushing)
            {
                this._lastFlushMs = 0;
                this._lastFlushJobs = 0;
            }

            return;
        }

        this.syncRenderer();

        const renderer = this._renderer;

        if(!renderer) return;

        this._flushing = true;
        this._flushJobs = 0;
        const startedAt = performance.now();

        try
        {
            for(const page of this._dirtyPages) this.flushPage(renderer, page);
        }
        finally
        {
            this._dirtyPages.clear();
            this._flushing = false;
            this._lastFlushMs = (performance.now() - startedAt);
            this._lastFlushJobs = this._flushJobs;
        }
    }

    private getGl(renderer: Renderer): AvatarAtlasGl
    {
        if(this._glRenderer !== renderer)
        {
            this._gl?.destroy();
            this._gl = AvatarAtlasGl.create(renderer);
            this._glRenderer = renderer;
        }

        return this._gl;
    }

    private flushPageGl(renderer: WebGLRenderer, gl: AvatarAtlasGl, page: AvatarAtlasPage): void
    {
        const slots = page.pending;
        const gutter = AvatarAtlasCompositor.GUTTER;
        const target = page.texture.source;

        for(const slot of slots) gl.eraseRect((slot.x - gutter), (slot.y - gutter), (page.width + gutter * 2), (page.height + gutter * 2));

        for(const slot of slots)
        {
            const parts = slot.pending;
            const partCount = slot.pendingCount;

            slot.pending = null;
            slot.pendingCount = 0;

            for(let index = 0; index < partCount; index++)
            {
                const part = parts[index];
                const layers = part.part.layers;

                // Disposed since it was queued (its avatar changed or left).
                if(!layers)
                {
                    slot.incomplete = true;

                    continue;
                }

                const x = (slot.x + part.x);
                const y = (slot.y + part.y);

                for(const layer of layers)
                {
                    const texture = layer.texture;

                    if(!texture || texture.destroyed || !texture.source)
                    {
                        slot.incomplete = true;

                        continue;
                    }

                    if(gl.full) gl.flush(renderer, target);

                    gl.layer(layer, x, y);
                }
            }

            MarkRegionHitMapDirty(slot.texture);
            this._flushJobs++;
        }

        slots.length = 0;

        gl.flush(renderer, target);
    }

    private flushPage(renderer: Renderer, page: AvatarAtlasPage): void
    {
        const slots = page.pending;

        if(!slots.length) return;

        const gl = AvatarAtlasCompositor.USE_GL ? this.getGl(renderer) : null;

        if(gl) return this.flushPageGl(renderer as WebGLRenderer, gl, page);

        const gutter = AvatarAtlasCompositor.GUTTER;

        let count = 0;

        try
        {
            // Clear every cell first; cells never overlap, so all the erasers batch together.
            for(const slot of slots) this.getQuad(count++).setEraser((slot.x - gutter), (slot.y - gutter), (page.width + gutter * 2), (page.height + gutter * 2));

            for(const slot of slots)
            {
                const parts = slot.pending;
                const partCount = slot.pendingCount;

                slot.pending = null;
                slot.pendingCount = 0;

                for(let index = 0; index < partCount; index++)
                {
                    const part = parts[index];
                    const layers = part.part.layers;

                    // Disposed since it was queued (its avatar changed or left).
                    if(!layers)
                    {
                        slot.incomplete = true;

                        continue;
                    }

                    const x = (slot.x + part.x);
                    const y = (slot.y + part.y);

                    for(const layer of layers)
                    {
                        const texture = layer.texture;

                        if(!texture || texture.destroyed || !texture.source)
                        {
                            slot.incomplete = true;

                            continue;
                        }

                        this.getQuad(count++).set(texture, (x + layer.x), (y + layer.y), layer.flipped, layer.tint);
                    }
                }

                MarkRegionHitMapDirty(slot.texture);
                this._flushJobs++;
            }

            slots.length = 0;

            this._batch.setQuads(this._quads, count);

            renderer.render({ container: this._root, target: page.texture, clear: false });
        }
        finally
        {
            for(let index = 0; index < count; index++) this._quads[index].reset();

            this._batch.setQuads(this._quads, 0);
        }
    }

    private getQuad(index: number): AvatarAtlasQuad
    {
        let quad = this._quads[index];

        if(!quad) quad = this._quads[index] = new AvatarAtlasQuad();

        return quad;
    }

    public contextChange(): void
    {
        // The writer's program and buffers belonged to the lost context.
        this._gl = null;
        this._glRenderer = null;

        // A restored context has empty pages: every avatar draws itself again.
        for(const pages of this._pages.values())
        {
            for(const page of pages)
            {
                for(const slot of page.slots) slot?.owner?.onAtlasContentLost();
            }
        }
    }

    public dispose(): void
    {
        this._renderer?.runners.contextChange?.remove(this);
        this._renderer = null;
        this._gl?.destroy();
        this._gl = null;

        for(const pages of this._pages.values())
        {
            for(const page of pages) page.destroy();
        }

        this._pages.clear();
        this._dirtyPages.clear();
        this._root.destroy({ children: true });
    }
}
