import { AlphaTolerance } from '@octane/api';
import { Filter, Texture, TextureSource } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomObjectSprite } from './RoomObjectSprite';
import { isWiredHighlightSource, WIRED_HIGHLIGHT_DEPTH_STEP, WIRED_HIGHLIGHT_PADDING, WIRED_HIGHLIGHT_TAG, WiredHighlightSilhouette } from './WiredHighlightSilhouette';

const { rendererState } = vi.hoisted(() => ({ rendererState: { value: null } }));

vi.mock('@octane/utils', () => ({ GetRenderer: () => rendererState.value }));

const makeRenderer = () =>
{
    const listeners: { contextChange: () => void }[] = [];

    return {
        render: vi.fn(),
        listeners,
        runners: { contextChange: { add: vi.fn((listener) => listeners.push(listener)), remove: vi.fn() } }
    };
};

const texture = (width: number, height: number): Texture => new Texture({ source: new TextureSource({ width, height }) });

const layer = (width: number, height: number, offsetX: number, offsetY: number, depth: number = 0): RoomObjectSprite =>
{
    const sprite = new RoomObjectSprite();

    sprite.texture = texture(width, height);
    sprite.offsetX = offsetX;
    sprite.offsetY = offsetY;
    sprite.relativeDepth = depth;

    return sprite;
};

const glow = [ new Filter({}) ];
const aura = [ new Filter({}), new Filter({}) ];

describe('WiredHighlightSilhouette', () =>
{
    let renderer: ReturnType<typeof makeRenderer>;

    beforeEach(() =>
    {
        renderer = makeRenderer();
        rendererState.value = renderer;
    });

    afterEach(() =>
    {
        rendererState.value = null;
    });

    it('draws one glow sprite behind every layer, 32 px around them', () =>
    {
        const silhouette = new WiredHighlightSilhouette();
        const sprites = [ layer(20, 10, 5, -30, 0.2), layer(10, 40, -15, -50, 0.4) ];

        expect(silhouette.update(sprites, glow, 255)).toBe(true);

        const sprite = silhouette.sprite;

        expect(sprite.visible).toBe(true);
        expect(sprite.offsetX).toBe(-15 - WIRED_HIGHLIGHT_PADDING);
        expect(sprite.offsetY).toBe(-50 - WIRED_HIGHLIGHT_PADDING);
        expect(sprite.relativeDepth).toBeCloseTo(0.4 + WIRED_HIGHLIGHT_DEPTH_STEP);
        expect(sprite.tag).toBe(WIRED_HIGHLIGHT_TAG);
        expect(sprite.alphaTolerance).toBe(AlphaTolerance.MATCH_NOTHING);
        expect(sprite.skipMouseHandling).toBe(true);
        // Textures grow in steps of 32: 40 + 64 wide, 40 + 64 high.
        expect(sprite.texture.width).toBe(128);
        expect(sprite.texture.height).toBe(128);
        // One silhouette pass, one glow pass.
        expect(renderer.render).toHaveBeenCalledTimes(2);
    });

    it('stacks each glow filter on its own and redraws only what changed', () =>
    {
        const silhouette = new WiredHighlightSilhouette();
        const sprites = [ layer(20, 10, 0, 0) ];

        silhouette.update(sprites, aura, 255);

        expect(renderer.render).toHaveBeenCalledTimes(3);
        expect(renderer.render.mock.calls[1][0].clear).toBe(true);
        expect(renderer.render.mock.calls[2][0].clear).toBe(false);

        renderer.render.mockClear();
        silhouette.update(sprites, aura, 255);
        expect(renderer.render).not.toHaveBeenCalled();

        silhouette.update(sprites, glow, 255);
        expect(renderer.render).toHaveBeenCalledTimes(1);

        renderer.render.mockClear();
        sprites[0].offsetX = 4;
        silhouette.update(sprites, glow, 255);
        expect(renderer.render).toHaveBeenCalledTimes(2);

        renderer.render.mockClear();
        silhouette.update(sprites, glow, 255, true);
        expect(renderer.render).toHaveBeenCalledTimes(2);
    });

    it('counts a flipped layer to the left of its offset', () =>
    {
        const silhouette = new WiredHighlightSilhouette();
        const flipped = layer(30, 10, 10, 0);

        flipped.flipH = true;
        silhouette.update([ flipped ], glow, 255);

        expect(silhouette.sprite.offsetX).toBe(-20 - WIRED_HIGHLIGHT_PADDING);
    });

    it('hides without sources, alpha or renderer, and clears without filters', () =>
    {
        const silhouette = new WiredHighlightSilhouette();
        const sprites = [ layer(20, 10, 0, 0) ];

        silhouette.update(sprites, glow, 255);
        silhouette.update(sprites, glow, 0);
        expect(silhouette.sprite.visible).toBe(false);

        silhouette.update([], glow, 255);
        expect(silhouette.sprite.visible).toBe(false);

        rendererState.value = null;
        silhouette.update(sprites, glow, 255);
        expect(silhouette.sprite.visible).toBe(false);

        rendererState.value = renderer;
        silhouette.update(sprites, glow, 255);
        expect(silhouette.sprite.visible).toBe(true);

        silhouette.update(sprites, null, 255);
        expect(silhouette.sprite.visible).toBe(false);
    });

    it('keeps its textures for smaller drawings and frees them on dispose', () =>
    {
        const silhouette = new WiredHighlightSilhouette();

        silhouette.update([ layer(100, 100, 0, 0) ], glow, 255);

        const big = silhouette.sprite.texture;

        silhouette.update([ layer(10, 10, 0, 0) ], glow, 255);
        expect(silhouette.sprite.texture).toBe(big);

        silhouette.dispose();
        expect(big.destroyed).toBe(true);
        expect(renderer.runners.contextChange.remove).toHaveBeenCalled();
    });

    it('rebuilds after the renderer lost its context', () =>
    {
        const silhouette = new WiredHighlightSilhouette();
        const sprites = [ layer(20, 10, 0, 0) ];

        silhouette.update(sprites, glow, 255);
        renderer.render.mockClear();

        renderer.listeners[0].contextChange();
        silhouette.update(sprites, glow, 255);

        expect(renderer.render).toHaveBeenCalledTimes(2);
    });

    it('leaves out hidden, see-through, additive and undrawn sprites', () =>
    {
        const hidden = layer(5, 5, 0, 0);
        const clear = layer(5, 5, 0, 0);
        const additive = layer(5, 5, 0, 0);
        const empty = new RoomObjectSprite();

        hidden.visible = false;
        clear.alpha = 0;
        additive.blendMode = 'add';
        empty.texture = Texture.EMPTY;

        expect([ hidden, clear, additive, empty, null ].map(isWiredHighlightSource)).toEqual([ false, false, false, false, false ]);
        expect(isWiredHighlightSource(layer(5, 5, 0, 0))).toBe(true);
    });
});
