import { GlRenderTargetAdaptor, Texture, TextureSource, WebGLRenderer } from 'pixi.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExtendedSprite } from './ExtendedSprite';

const { rendererState } = vi.hoisted(() => ({ rendererState: { value: null } }));

vi.mock('@octane/utils', () => ({
    GetRenderer: () => rendererState.value,
    TextureUtils: {}
}));

const makeTexture = (): Texture => new Texture({ source: new TextureSource({ width: 4, height: 4 }) });

describe('ExtendedSprite texture lifecycle', () =>
{
    it('falls back to Texture.EMPTY when its texture is destroyed', () =>
    {
        const texture = makeTexture();
        const sprite = new ExtendedSprite({ texture });

        expect(sprite.needsUpdate(1, 1)).toBe(true);

        texture.destroy(true);

        expect(sprite.texture).toBe(Texture.EMPTY);
        expect(sprite.needsUpdate(1, 1)).toBe(true);
    });

    it('stops listening to a texture it no longer shows', () =>
    {
        const first = makeTexture();
        const second = makeTexture();
        const sprite = new ExtendedSprite({ texture: first });

        sprite.setTexture(second);

        expect(first.listenerCount('destroy')).toBe(0);
        expect(second.listenerCount('destroy')).toBe(1);

        first.destroy(true);

        expect(sprite.texture).toBe(second);

        sprite.destroy();

        expect(second.listenerCount('destroy')).toBe(0);
        expect(second.destroyed).toBe(false);
    });

    it('never subscribes to Texture.EMPTY', () =>
    {
        const before = Texture.EMPTY.listenerCount('destroy');
        const sprite = new ExtendedSprite();

        sprite.setTexture(makeTexture());
        sprite.setTexture(null);

        expect(sprite.texture).toBe(Texture.EMPTY);
        expect(Texture.EMPTY.listenerCount('destroy')).toBe(before);
    });

    it('keeps one destroy listener per shared texture and still tells every sprite', () =>
    {
        const shared = makeTexture();
        const sprites = Array.from({ length: 500 }, () => new ExtendedSprite({ texture: shared }));

        expect(shared.listenerCount('destroy')).toBe(1);

        sprites[0].setTexture(makeTexture());
        sprites[1].destroy();

        expect(shared.listenerCount('destroy')).toBe(1);

        shared.destroy(true);

        expect(sprites.slice(2).every(sprite => sprite.texture === Texture.EMPTY)).toBe(true);
        expect(sprites[0].texture).not.toBe(Texture.EMPTY);
    });

    it('drops the shared listener when the last sprite stops showing the texture', () =>
    {
        const shared = makeTexture();
        const a = new ExtendedSprite({ texture: shared });
        const b = new ExtendedSprite({ texture: shared });

        a.setTexture(null);
        expect(shared.listenerCount('destroy')).toBe(1);

        b.destroy();
        expect(shared.listenerCount('destroy')).toBe(0);
    });
});

describe('ExtendedSprite hit maps', () =>
{
    afterEach(() =>
    {
        rendererState.value = null;
        vi.unstubAllGlobals();
    });

    const makeGlRenderer = (failRead: boolean) =>
    {
        const drawFramebuffer = {};
        const textureFramebuffer = {};
        const state = { bound: drawFramebuffer, reads: 0 };
        const gl = {
            FRAMEBUFFER: 1,
            FRAMEBUFFER_BINDING: 2,
            RGBA: 3,
            UNSIGNED_BYTE: 4,
            getParameter: () => state.bound,
            bindFramebuffer: (_target: number, framebuffer: object) =>
            {
                state.bound = framebuffer;
            },
            readPixels: (_x: number, _y: number, _width: number, _height: number, _format: number, _type: number, pixels: Uint8ClampedArray) =>
            {
                state.reads++;

                if(failRead) throw new Error('read failed');

                pixels.fill(255);
            }
        };
        const renderer = Object.create(WebGLRenderer.prototype);
        const adaptor = new GlRenderTargetAdaptor();

        Object.defineProperty(renderer, 'gl', { value: gl });
        renderer.runners = { contextChange: { add: vi.fn() } };
        renderer.renderTarget = {
            adaptor,
            getRenderTarget: vi.fn(),
            getGpuRenderTarget: () =>
            {
                // Allocating a Pixi render target can change the native binding.
                gl.bindFramebuffer(gl.FRAMEBUFFER, textureFramebuffer);

                return { resolveTargetFramebuffer: textureFramebuffer };
            }
        };
        adaptor.init(renderer, renderer.renderTarget);
        adaptor.bindFramebuffer(drawFramebuffer);

        return { renderer, adaptor, drawFramebuffer, state };
    };

    const readHitMap = (source: TextureSource) => (ExtendedSprite as any).generateHitMapForTextureSource(source);

    it.each([ false, true ])('leaves Pixi drawing to its own framebuffer after a read (read fails: %s)', failRead =>
    {
        const { renderer, adaptor, drawFramebuffer, state } = makeGlRenderer(failRead);
        const source = new TextureSource({ width: 4, height: 4 });

        rendererState.value = renderer;

        if(failRead) expect(() => readHitMap(source)).toThrow('read failed');
        else
        {
            expect(readHitMap(source)).toBe(true);
            expect(source.hitMap?.every((value: number) => value === 255)).toBe(true);
        }

        // Pixi skips this bind when it believes the draw target is still active.
        adaptor.bindFramebuffer(drawFramebuffer);
        expect(state.bound).toBe(drawFramebuffer);
        source.destroy();
    });

    it('reads a decoded image on the CPU without touching the GPU', () =>
    {
        class FakeBitmap
        {
            constructor(public width: number, public height: number)
            {}
        }

        const drawn: unknown[] = [];

        class FakeCanvas
        {
            constructor(private _width: number, private _height: number)
            {}

            getContext()
            {
                return {
                    drawImage: (image: unknown) => drawn.push(image),
                    getImageData: () => ({ data: new Uint8ClampedArray(this._width * this._height * 4).fill(128) })
                };
            }
        }

        vi.stubGlobal('ImageBitmap', FakeBitmap);
        vi.stubGlobal('OffscreenCanvas', FakeCanvas);

        const { renderer, state } = makeGlRenderer(false);
        const bitmap = new FakeBitmap(4, 4);
        const source = new TextureSource({ width: 4, height: 4, resource: bitmap as unknown as ImageBitmap });

        rendererState.value = renderer;

        expect(readHitMap(source)).toBe(true);
        expect(drawn).toEqual([ bitmap ]);
        expect(state.reads).toBe(0);
        expect(source.hitMap[3]).toBe(128);
        source.destroy();
    });
});
