import { Container, Filter, Texture, TextureSource } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WiredFilter } from '../../../../utils/src/filters/WiredFilter';
import { ExtendedSprite } from './ExtendedSprite';
import { WiredHighlightCache } from './WiredHighlightCache';

const { rendererState } = vi.hoisted(() => ({ rendererState: { value: null } }));

vi.mock('@octane/utils', async () => ({
    GetRenderer: () => rendererState.value,
    TextureUtils: {},
    WiredFilter: (await import('../../../../utils/src/filters/WiredFilter')).WiredFilter
}));

class FakeBitmap
{
    constructor(public width: number, public height: number)
    {}
    close(): void
    {}
}

const makeRenderer = () => ({
    render: vi.fn(),
    runners: { contextChange: { add: vi.fn(), remove: vi.fn() } }
});

const makeImageTexture = (width = 8, height = 6): Texture =>
{
    const source = new TextureSource({ resource: new FakeBitmap(width, height) as unknown as ImageBitmap, width, height, scaleMode: 'nearest' });

    return new Texture({ source });
};

describe('WiredHighlightCache', () =>
{
    let renderer: ReturnType<typeof makeRenderer>;

    beforeEach(() =>
    {
        vi.stubGlobal('ImageBitmap', FakeBitmap);

        // A new renderer drops every drawing of the previous test.
        renderer = makeRenderer();
        rendererState.value = renderer;
    });

    afterEach(() =>
    {
        vi.unstubAllGlobals();
    });

    it('only takes a single WiredFilter', () =>
    {
        const wired = new WiredFilter({ lineColor: 0xFFFFFF, color: 0x00FF00 });

        expect(WiredHighlightCache.getFilter([ wired ])).toBe(wired);
        expect(WiredHighlightCache.getFilter([ wired, wired ])).toBeNull();
        expect(WiredHighlightCache.getFilter([ new Filter({}) ])).toBeNull();
        expect(WiredHighlightCache.getFilter(null)).toBeNull();
    });

    it('draws a texture through a filter once and shares the drawing', () =>
    {
        const texture = makeImageTexture();
        const filter = new WiredFilter({ lineColor: 0xFFFFFF, color: 0x00FF00 });

        const a = WiredHighlightCache.acquire(texture, filter);
        const b = WiredHighlightCache.acquire(texture, filter);

        expect(a).not.toBeNull();
        expect(b).toBe(a);
        expect(renderer.render).toHaveBeenCalledTimes(1);
        expect(a.texture.width).toBe(8);
        expect(a.texture.height).toBe(6);

        WiredHighlightCache.validate(a);

        expect(renderer.render).toHaveBeenCalledTimes(1);

        WiredHighlightCache.release(a);
        WiredHighlightCache.release(b);
    });

    it('redraws in place when the filter colours or the source change', () =>
    {
        const texture = makeImageTexture();
        const filter = new WiredFilter({ lineColor: 0xFFFFFF, color: 0x00FF00 });
        const highlight = WiredHighlightCache.acquire(texture, filter);
        const drawn = highlight.texture;

        filter.color = 0xFF0000;
        WiredHighlightCache.validate(highlight);

        expect(renderer.render).toHaveBeenCalledTimes(2);

        texture.source.emit('update', texture.source);
        WiredHighlightCache.validate(highlight);

        expect(renderer.render).toHaveBeenCalledTimes(3);
        expect(highlight.texture).toBe(drawn);

        WiredHighlightCache.release(highlight);
    });

    it('skips sources that are not loaded nearest-scaled images', () =>
    {
        const filter = new WiredFilter({ lineColor: 0xFFFFFF, color: 0x00FF00 });
        const renderTextureLike = new Texture({ source: new TextureSource({ width: 4, height: 4 }) });
        const linear = new Texture({ source: new TextureSource({ resource: new FakeBitmap(4, 4) as unknown as ImageBitmap, width: 4, height: 4, scaleMode: 'linear' }) });

        expect(WiredHighlightCache.acquire(renderTextureLike, filter)).toBeNull();
        expect(WiredHighlightCache.acquire(linear, filter)).toBeNull();
        expect(WiredHighlightCache.acquire(Texture.EMPTY, filter)).toBeNull();
        expect(renderer.render).not.toHaveBeenCalled();
    });

    it('drops a drawing with its source texture', () =>
    {
        const texture = makeImageTexture();
        const filter = new WiredFilter({ lineColor: 0xFFFFFF, color: 0x00FF00 });
        const highlight = WiredHighlightCache.acquire(texture, filter);
        const drawn = highlight.texture;

        texture.destroy(true);

        expect(drawn.destroyed).toBe(true);
        expect(highlight.texture).toBeNull();
    });
});

describe('ExtendedSprite wired highlight', () =>
{
    let renderer: ReturnType<typeof makeRenderer>;

    beforeEach(() =>
    {
        vi.stubGlobal('ImageBitmap', FakeBitmap);

        renderer = makeRenderer();
        rendererState.value = renderer;
    });

    afterEach(() =>
    {
        vi.unstubAllGlobals();
    });

    it('shows the drawn frame instead of running the filter, and keeps hit testing on the source', () =>
    {
        const texture = makeImageTexture();
        const filter = new WiredFilter({ lineColor: 0xFFFFFF, color: 0x00FF00 });
        const sprite = new ExtendedSprite({ texture });

        sprite.setFilters([ filter ]);
        sprite.updateHighlight();

        expect(sprite.hasHighlight).toBe(true);
        expect(sprite.texture).not.toBe(texture);
        expect(sprite.sourceTexture).toBe(texture);
        expect(sprite.filters?.length ?? 0).toBe(0);

        // Same filter list and texture next frame: nothing is redrawn.
        sprite.updateHighlight();
        sprite.validateHighlight();

        expect(renderer.render).toHaveBeenCalledTimes(1);

        sprite.setFilters(null);
        sprite.updateHighlight();

        expect(sprite.hasHighlight).toBe(false);
        expect(sprite.texture).toBe(texture);
    });

    it('keeps the filter for tinted, faded or flipped sprites', () =>
    {
        const texture = makeImageTexture();
        const filter = new WiredFilter({ lineColor: 0xFFFFFF, color: 0x00FF00 });
        const filters = [ filter ];

        for(const change of [ (s: ExtendedSprite) => s.tint = 0xFF0000, (s: ExtendedSprite) => s.alpha = 0.5, (s: ExtendedSprite) => s.scale.x = -1 ])
        {
            const sprite = new ExtendedSprite({ texture });

            change(sprite);
            sprite.setFilters(filters);
            sprite.updateHighlight();

            expect(sprite.hasHighlight).toBe(false);
            expect(sprite.texture).toBe(texture);
            expect(sprite.filters).toEqual(filters);
        }

        expect(renderer.render).not.toHaveBeenCalled();
    });

    it('waits for a zoomed parent and picks the drawing up once the parent is plain', () =>
    {
        const texture = makeImageTexture();
        const filter = new WiredFilter({ lineColor: 0xFFFFFF, color: 0x00FF00 });
        const parent = new Container();
        const sprite = new ExtendedSprite({ texture });

        parent.addChild(sprite);
        parent.scale.set(2);

        sprite.setFilters([ filter ]);
        sprite.updateHighlight();

        expect(sprite.hasHighlight).toBe(false);

        parent.scale.set(1);
        sprite.validateHighlight();

        expect(sprite.hasHighlight).toBe(true);

        parent.scale.set(2);
        sprite.validateHighlight();

        expect(sprite.hasHighlight).toBe(false);
        expect(sprite.texture).toBe(texture);
        expect(sprite.filters).toHaveLength(1);
    });

    it('falls back to the filter when the drawing is destroyed and to EMPTY when the source is', () =>
    {
        const texture = makeImageTexture();
        const filter = new WiredFilter({ lineColor: 0xFFFFFF, color: 0x00FF00 });
        const sprite = new ExtendedSprite({ texture });

        sprite.setFilters([ filter ]);
        sprite.updateHighlight();

        texture.destroy(true);

        expect(sprite.hasHighlight).toBe(false);
        expect(sprite.texture).toBe(Texture.EMPTY);
        expect(sprite.needsUpdate(1, 1)).toBe(true);
    });

    it('releases its drawing on destroy so it can be trimmed', () =>
    {
        const texture = makeImageTexture();
        const filter = new WiredFilter({ lineColor: 0xFFFFFF, color: 0x00FF00 });
        const a = new ExtendedSprite({ texture });
        const b = new ExtendedSprite({ texture });

        a.setFilters([ filter ]);
        b.setFilters([ filter ]);
        a.updateHighlight();
        b.updateHighlight();

        expect(a.texture).toBe(b.texture);
        expect(renderer.render).toHaveBeenCalledTimes(1);

        const drawn = a.texture;

        a.destroy();
        b.destroy();

        // Unused but within budget: kept for a mark toggled back on.
        expect(drawn.destroyed).toBe(false);

        const again = WiredHighlightCache.acquire(texture, filter);

        expect(again.texture).toBe(drawn);
        expect(renderer.render).toHaveBeenCalledTimes(1);

        WiredHighlightCache.release(again);
    });
});
