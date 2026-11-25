import { AvatarAction, AvatarSetType, IActionDefinition, IPartColor } from '@octane/api';
import { CanvasSource, ColorMatrixFilter, Container, ImageSource, Point, Rectangle, RenderTexture, Sprite, Texture } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GraphicAsset } from '@octane/assets';
import { AvatarFigureContainer } from '../AvatarFigureContainer';
import { AvatarImage } from '../AvatarImage';
import { AvatarImageBodyPartContainer } from '../AvatarImageBodyPartContainer';
import { AvatarImagePartContainer } from '../AvatarImagePartContainer';
import { AvatarRenderManager } from '../AvatarRenderManager';
import { AvatarStructure } from '../AvatarStructure';
import { EffectAssetDownloadManager } from '../EffectAssetDownloadManager';
import { AssetAliasCollection } from '../alias';
import { HabboAvatarGeometry } from '../data/HabboAvatarGeometry';
import { AvatarCanvas } from '../structure';
import { AvatarFrameTextureCache } from './AvatarFrameTextureCache';
import { AvatarImageCache } from './AvatarImageCache';

const rendering = vi.hoisted(() => ({ passes: 0, allocations: 0 }));
const pool = vi.hoisted(() => ({ getTexture: vi.fn(), putTexture: vi.fn() }));
const renderer = vi.hoisted(() => ({
    render: () => rendering.passes++,
    runners: { contextChange: { add: vi.fn(), remove: vi.fn() } }
}));

vi.mock('@octane/utils', async importOriginal => ({
    ...await importOriginal<typeof import('@octane/utils')>(),
    GetRenderer: () => renderer,
    GetTexturePool: () => pool,
    GetTickerTime: () => 100000
}));

let textures: Texture[];
let containers: Container[];

const imageTexture = () =>
{
    const image = new Image(8, 12);
    const texture = new Texture({ source: new ImageSource({ resource: image, width: 8, height: 12 }) });

    textures.push(texture);

    return texture;
};

const composition = (texture: Texture, tint: number = 0xFFFFFF) =>
{
    const root = new Container();
    const nested = root.addChild(new Container());
    const sprite = nested.addChild(new Sprite(texture));

    nested.position.set(12, 18);
    sprite.tint = tint;
    containers.push(root);

    return root;
};

beforeEach(() =>
{
    rendering.passes = 0;
    rendering.allocations = 0;
    textures = [];
    containers = [];
    pool.putTexture.mockReset();
    renderer.runners.contextChange.add.mockReset();
    renderer.runners.contextChange.remove.mockReset();
    pool.getTexture.mockReset().mockImplementation((width: number, height: number) =>
    {
        rendering.allocations++;
        const texture = RenderTexture.create({ width, height });

        textures.push(texture);

        return texture;
    });
});

afterEach(() =>
{
    for(const container of containers) if(!container.destroyed) container.destroy({ children: true });
    for(const texture of textures) if(!texture.destroyed) texture.destroy(true);
});

describe('immutable avatar frame texture cache', () =>
{
    it('shares identical pixels without redrawing or invalidating an already computed hit map', () =>
    {
        const cache = new AvatarFrameTextureCache();
        const texture = imageTexture();
        const first = cache.acquire(composition(texture), 64, 110);
        const hitMap = new Uint8Array([1]);

        first.texture.source.hitMap = hitMap;
        first.texture.source.hitMapDirty = false;

        const second = cache.acquire(composition(texture), 64, 110);

        expect(second.texture).toBe(first.texture);
        expect(rendering.passes).toBe(1);
        expect(second.texture.source.hitMap).toBe(hitMap);
        expect(second.texture.source.hitMapDirty).toBe(false);
        cache.release(first);
        cache.release(second);
        cache.dispose();
        expect(pool.putTexture).toHaveBeenCalledExactlyOnceWith(first.texture);
    });

    it.each(['tint', 'nested transform', 'order', 'alpha', 'blend', 'anchor', 'UVs', 'canvas size', 'source update', 'source style'])('isolates %s changes', change =>
    {
        const cache = new AvatarFrameTextureCache();
        const texture = imageTexture();
        const root = composition(texture);
        const nested = root.children[0];
        const sprite = nested.children[0] as Sprite;
        const first = cache.acquire(root, 64, 110);

        switch(change)
        {
            case 'tint': sprite.tint = 0xFF0000; break;
            case 'nested transform': nested.x++; break;
            case 'order': nested.addChildAt(new Sprite(imageTexture()), 0); break;
            case 'alpha': sprite.alpha = 0.5; break;
            case 'blend': sprite.blendMode = 'add'; break;
            case 'anchor': sprite.anchor.x = 0.5; break;
            case 'UVs': texture.frame.x = 1; texture.frame.width = 7; texture.update(); break;
            case 'source update': texture.source.update(); break;
            case 'source style': texture.source.scaleMode = texture.source.scaleMode === 'nearest' ? 'linear' : 'nearest'; break;
        }

        const second = cache.acquire(root, change === 'canvas size' ? 96 : 64, 110);

        expect(second.texture).not.toBe(first.texture);
        expect(rendering.passes).toBe(2);
        cache.release(first);
        cache.release(second);
        cache.dispose();
    });

    it('keys the order of otherwise identical nested children', () =>
    {
        const cache = new AvatarFrameTextureCache();
        const root = composition(imageTexture());
        const nested = root.children[0];

        nested.addChild(new Sprite(imageTexture()));

        const first = cache.acquire(root, 64, 110);

        nested.swapChildren(nested.children[0], nested.children[1]);

        const second = cache.acquire(root, 64, 110);

        expect(second.texture).not.toBe(first.texture);
        cache.release(first);
        cache.release(second);
        cache.dispose();
    });

    it('bypasses filters, mutable canvas/render textures, and custom drawables', () =>
    {
        const cache = new AvatarFrameTextureCache();
        const filtered = composition(imageTexture());
        const filter = new ColorMatrixFilter();
        const canvasTexture = new Texture({ source: new CanvasSource({ resource: document.createElement('canvas') }) });
        const renderTexture = RenderTexture.create({ width: 8, height: 12 });

        filtered.filters = [filter];
        textures.push(canvasTexture, renderTexture);

        class CustomContainer extends Container
        {}

        expect(cache.acquire(filtered, 64, 110)).toBeNull();
        expect(cache.acquire(composition(canvasTexture), 64, 110)).toBeNull();
        expect(cache.acquire(composition(renderTexture), 64, 110)).toBeNull();
        expect(cache.acquire(new CustomContainer(), 64, 110)).toBeNull();
        expect(rendering.passes).toBe(0);
        filter.destroy();
        cache.dispose();
    });

    it.each([['entry limit', 1, 1024], ['byte limit', 10, 64]] as const)('protects borrowed frames under the %s', (_, entries, bytes) =>
    {
        const cache = new AvatarFrameTextureCache(entries, bytes);
        const first = cache.acquire(composition(imageTexture()), 4, 4);
        const nextComposition = composition(imageTexture());

        expect(cache.acquire(nextComposition, 4, 4)).toBeNull();
        expect(pool.putTexture).not.toHaveBeenCalled();
        cache.release(first);

        const second = cache.acquire(nextComposition, 4, 4);

        expect(second).not.toBeNull();
        expect(pool.putTexture).toHaveBeenCalledExactlyOnceWith(first.texture);
        cache.release(second);
        cache.dispose();
        cache.dispose();
        expect(pool.putTexture).toHaveBeenCalledTimes(2);
    });

    it('recycles a disposed cache output only after its last borrower releases it', () =>
    {
        const cache = new AvatarFrameTextureCache();
        const root = composition(imageTexture());
        const first = cache.acquire(root, 64, 110);
        const second = cache.acquire(root, 64, 110);

        cache.dispose();
        cache.dispose();
        cache.release(first);
        expect(pool.putTexture).not.toHaveBeenCalled();
        expect(cache.acquire(root, 64, 110)).toBeNull();
        cache.release(second);
        expect(pool.putTexture).toHaveBeenCalledExactlyOnceWith(first.texture);
    });

    it('bounds actual pixel storage for a higher resolution pooled output', () =>
    {
        const cache = new AvatarFrameTextureCache(10, 64);
        const output = RenderTexture.create({ width: 4, height: 4, resolution: 2 });

        textures.push(output);
        pool.getTexture.mockReturnValueOnce(output);
        expect(cache.acquire(composition(imageTexture()), 4, 4)).toBeNull();
        expect(rendering.passes).toBe(0);
        expect(pool.putTexture).toHaveBeenCalledExactlyOnceWith(output);
        cache.dispose();
    });
});

// Real AvatarImage and body-part caches, synthetic static assets/structure, counted GPU seam.
const avatarFixture = (manager: AvatarRenderManager = null, effectFilter: ColorMatrixFilter = null) =>
{
    const bodyParts = ['head', 'body', 'feet'];
    const assets = new Map<string, object>();
    const definition = (state: string): IActionDefinition => ({
        id: state, state, geometryType: state === 'lay' ? 'horizontal' : 'vertical',
        assetPartDefinition: state, isMain: state !== AvatarAction.EFFECT, isAnimation: state === AvatarAction.EFFECT,
        startFromFrameZero: false, getPreventHeadTurn: () => false, isAnimated: () => true
    } as unknown as IActionDefinition);
    const structure = {
        getActionDefinition: () => definition('std'),
        getActionDefinitionWithState: (state: string) => definition(state),
        isMainAvatarSet: (set: string) => set === AvatarSetType.FULL,
        getBodyPartsUnordered: (set: string) => set === AvatarSetType.HEAD ? ['head'] : bodyParts,
        getBodyParts: (set: string) => set === AvatarSetType.HEAD ? ['head'] : bodyParts,
        removeDynamicItems: () => undefined,
        getActiveBodyPartIds: () => bodyParts,
        getCanvas: (_scale: string, geometry: string) => new AvatarCanvas(HabboAvatarGeometry.geometry.canvases[0].geometries.find(canvas => canvas.id === geometry), 'h'),
        getParts: (part: string, figure: AvatarFigureContainer, action: { definition: IActionDefinition }) => [
            new AvatarImagePartContainer(part, part, '1', { rgb: figure.getPartColorIds('ch')[0] } as IPartColor,
                [null, null, null, null], action.definition, true, 0, part)
        ],
        getFrameBodyPartOffset: () => new Point(),
        sortActions: (actions: { actionType: string; actionParameter: string; definition: IActionDefinition }[]) =>
        {
            for(const action of actions) action.definition = definition(action.actionType === AvatarAction.POSTURE ? action.actionParameter : action.actionType);

            return actions;
        },
        maxFrames: () => 4,
        getCanvasOffsets: () => [0, 0, 0],
        getAnimation: () => ({
            getLayerData: () => null, removeData: [], spriteData: [], hasOverriddenActions: () => false,
            hasDirectionData: () => false, hasAvatarData: () => !!effectFilter,
            avatarData: { colorTransform: effectFilter, paletteIsGrayscale: false }
        })
    } as unknown as AvatarStructure;
    const aliases = {
        getAsset: (name: string) =>
        {
            if(!assets.has(name)) assets.set(name, { texture: imageTexture(), rectangle: new Rectangle(0, 0, 8, 12), x: 0, y: 0 });

            return assets.get(name);
        }
    } as unknown as AssetAliasCollection;
    const effectManager = { isAvatarEffectReady: () => true } as unknown as EffectAssetDownloadManager;

    if(manager) Object.assign(manager, {
        _structure: structure, _aliasCollection: aliases,
        _avatarAssetDownloadManager: { isAvatarFigureContainerReady: () => true, dispose: () => undefined }
    });

    return (cache: AvatarFrameTextureCache = null, color: number = 0xFFFFFF) =>
    {
        const figure = `ch-1-${color}`;
        const avatar = manager ? manager.createAvatarImage(figure, 'h', null) as AvatarImage :
            new AvatarImage(structure, aliases, new AvatarFigureContainer(figure), 'h', effectManager, null, cache);

        avatar.initActionAppends();
        avatar.appendAction(AvatarAction.POSTURE, AvatarAction.POSTURE_WALK);
        avatar.endActionAppends();

        return avatar;
    };
};

describe('AvatarImage shared output integration', () =>
{
    it('reuses a warmed walk cycle without constructing or hashing sprite trees', () =>
    {
        const cache = new AvatarFrameTextureCache();
        const avatar = avatarFixture()(cache);

        for(let frame = 0; frame < 4; frame++)
        {
            avatar.processAsTexture(AvatarSetType.FULL, false);
            avatar.updateAnimationByFrames(1);
        }

        const build = vi.spyOn(avatar as any, 'buildAvatarContainer');
        const acquire = vi.spyOn(cache, 'acquire');

        for(let frame = 0; frame < 20; frame++)
        {
            avatar.processAsTexture(AvatarSetType.FULL, false);
            avatar.updateAnimationByFrames(1);
        }

        expect(build).not.toHaveBeenCalled();
        expect(acquire).not.toHaveBeenCalled();
        expect(rendering.passes).toBe(4);
        expect(Array.from((cache as any)._frames.values()).map((frame: any) => frame.references).sort()).toEqual([0, 0, 0, 1]);
        avatar.dispose();
        cache.dispose();
    });

    it.each(['source', 'UVs', 'sampling'])('invalidates warmed composition hints after %s changes', change =>
    {
        const cache = new AvatarFrameTextureCache();
        const avatar = avatarFixture()(cache);
        const original = avatar.processAsTexture(AvatarSetType.FULL, false);
        const sources = textures.filter(texture => texture.source instanceof ImageSource);

        for(const texture of sources)
        {
            if(change === 'source') texture.source.update();
            if(change === 'UVs')
            {
                texture.frame.x++;
                texture.update();
            }
            if(change === 'sampling')
            {
                texture.source.scaleMode = texture.source.scaleMode === 'nearest' ? 'linear' : 'nearest';
                texture.source.style.update();
            }
        }

        // Even an idle avatar must notice an updated asset.
        expect(avatar.processAsTexture(AvatarSetType.FULL, false)).not.toBe(original);
        expect(rendering.passes).toBe(2);
        avatar.dispose();
        cache.dispose();
    });

    it('does not pin hinted frames against the global budget or reuse an evicted output', () =>
    {
        const cache = new AvatarFrameTextureCache(2);
        const avatar = avatarFixture()(cache);
        const first = avatar.processAsTexture(AvatarSetType.FULL, false);

        avatar.updateAnimationByFrames(1);
        avatar.processAsTexture(AvatarSetType.FULL, false);
        avatar.updateAnimationByFrames(1);
        avatar.processAsTexture(AvatarSetType.FULL, false);
        expect(pool.putTexture).toHaveBeenCalledWith(first);
        avatar.resetAnimationFrameCounter();
        expect(avatar.processAsTexture(AvatarSetType.FULL, false)).not.toBe(first);
        expect((cache as any)._frames.size).toBe(2);
        expect(rendering.passes).toBe(4);
        avatar.dispose();
        cache.dispose();
    });

    it('keys current part placement and bounds composition hints across direction changes', () =>
    {
        const cache = new AvatarFrameTextureCache();
        const avatar = avatarFixture()(cache);
        const internals = avatar as any;
        const original = avatar.processAsTexture(AvatarSetType.FULL, false);
        const offset = vi.spyOn(internals._structure, 'getFrameBodyPartOffset').mockReturnValue(new Point(3, 7));

        avatar.updateAnimationByFrames(4);
        expect(avatar.processAsTexture(AvatarSetType.FULL, false)).not.toBe(original);
        offset.mockRestore();

        for(let direction = 0; direction < 8; direction++)
        {
            avatar.setDirection(AvatarSetType.FULL, direction);
            for(let frame = 0; frame < 4; frame++)
            {
                avatar.updateAnimationByFrames(1);
                avatar.processAsTexture(AvatarSetType.FULL, false);
            }
        }

        expect(internals._compositions.size).toBe(8);
        avatar.dispose();
        expect(internals._compositions.size).toBe(0);
        cache.dispose();
    });

    it('preserves frame, figure tint, head/body direction, posture dimensions and set selection', () =>
    {
        const create = avatarFixture();
        const cache = new AvatarFrameTextureCache();
        const first = create(cache);
        const second = create(cache);
        const colored = create(cache, 0xFF0000);
        const original = first.processAsTexture(AvatarSetType.FULL, false);

        expect(second.processAsTexture(AvatarSetType.FULL, false)).toBe(original);
        expect(colored.processAsTexture(AvatarSetType.FULL, false)).not.toBe(original);
        second.updateAnimationByFrames(1);
        expect(second.processAsTexture(AvatarSetType.FULL, false)).not.toBe(original);
        second.updateAnimationByFrames(3);
        expect(second.processAsTexture(AvatarSetType.FULL, false)).toBe(original);
        second.setDirection(AvatarSetType.HEAD, 1);
        expect(second.processAsTexture(AvatarSetType.FULL, false)).not.toBe(original);
        second.setDirection(AvatarSetType.FULL, 1);
        const turned = second.processAsTexture(AvatarSetType.FULL, false);

        expect(turned).not.toBe(original);
        expect(second.processAsTexture(AvatarSetType.HEAD, false)).not.toBe(turned);
        second.initActionAppends();
        second.appendAction(AvatarAction.POSTURE, AvatarAction.POSTURE_LAY);
        second.endActionAppends();
        expect(second.processAsTexture(AvatarSetType.FULL, false).width).toBe(128);
        expect(first.processAsTexture(AvatarSetType.FULL, false)).toBe(original);
        cache.dispose();
        expect(pool.putTexture).not.toHaveBeenCalledWith(original);
        first.dispose();
        first.dispose();
        expect(pool.putTexture.mock.calls.filter(([texture]) => texture === original)).toHaveLength(1);
        second.dispose();
        colored.dispose();
    });

    it('defers manager disposal recycling until both avatars release their shared output', () =>
    {
        const manager = new AvatarRenderManager();
        const create = avatarFixture(manager);
        const first = create();
        const second = create();
        const output = first.processAsTexture(AvatarSetType.FULL, false);

        expect(second.processAsTexture(AvatarSetType.FULL, false)).toBe(output);
        manager.dispose();
        manager.dispose();
        first.dispose();
        first.dispose();
        expect(pool.putTexture).not.toHaveBeenCalledWith(output);
        second.dispose();
        second.dispose();
        expect(pool.putTexture).toHaveBeenCalledExactlyOnceWith(output);
    });

    it('redraws after context restoration and defers recycling old borrowed outputs', () =>
    {
        const cache = new AvatarFrameTextureCache();
        const create = avatarFixture();
        const first = create(cache);
        const second = create(cache);
        const original = first.processAsTexture(AvatarSetType.FULL, false);

        expect(second.processAsTexture(AvatarSetType.FULL, false)).toBe(original);
        expect(renderer.runners.contextChange.add).toHaveBeenCalledExactlyOnceWith(cache);
        const listener = renderer.runners.contextChange.add.mock.calls[0][0] as AvatarFrameTextureCache;

        listener.contextChange();
        expect(pool.putTexture).not.toHaveBeenCalledWith(original);

        const restored = first.processAsTexture(AvatarSetType.FULL, false);

        expect(restored).not.toBe(original);
        expect(rendering.passes).toBe(2);
        expect(second.processAsTexture(AvatarSetType.FULL, false)).toBe(restored);
        expect(pool.putTexture).toHaveBeenCalledExactlyOnceWith(original);
        first.dispose();
        second.dispose();
        cache.dispose();
        expect(renderer.runners.contextChange.remove).toHaveBeenCalledExactlyOnceWith(cache);
    });

    it('switches filtered effects to a private output and restores the shared walking frame', () =>
    {
        const filter = new ColorMatrixFilter();
        const create = avatarFixture(null, filter);
        const cache = new AvatarFrameTextureCache();
        const first = create(cache);
        const second = create(cache);
        const shared = first.processAsTexture(AvatarSetType.FULL, false);

        expect(second.processAsTexture(AvatarSetType.FULL, false)).toBe(shared);
        first.initActionAppends();
        first.appendAction(AvatarAction.POSTURE, AvatarAction.POSTURE_WALK);
        first.appendAction(AvatarAction.EFFECT, '1');
        first.endActionAppends();

        const effect = first.processAsTexture(AvatarSetType.FULL, false);

        expect(effect).not.toBe(shared);
        first.updateAnimationByFrames(1);
        expect(first.processAsTexture(AvatarSetType.FULL, false)).toBe(effect);
        expect(second.processAsTexture(AvatarSetType.FULL, false)).toBe(shared);
        expect(pool.putTexture).not.toHaveBeenCalledWith(shared);
        first.initActionAppends();
        first.appendAction(AvatarAction.POSTURE, AvatarAction.POSTURE_WALK);
        first.endActionAppends();
        first.resetAnimationFrameCounter();
        expect(first.processAsTexture(AvatarSetType.FULL, false)).toBe(shared);
        expect(pool.putTexture).toHaveBeenCalledWith(effect);
        first.dispose();
        second.dispose();
        cache.dispose();
        filter.destroy();
    });

    it('uses private outputs and disposes noncacheable body parts after every render', () =>
    {
        const cache = new AvatarFrameTextureCache();
        const create = avatarFixture();
        const first = create(cache);
        const second = create(cache);
        const disposed: AvatarImageBodyPartContainer[] = [];
        const texture = imageTexture();

        for(const avatar of [first, second])
        {
            const internals = avatar as unknown as { _cache: AvatarImageCache };

            vi.spyOn(internals._cache, 'getImageContainer').mockImplementation(() =>
            {
                const part = new AvatarImageBodyPartContainer([{ texture, flipped: false, x: 0, y: 0, tint: 0xFFFFFF }], texture.width, texture.height, new Point(), false, null);

                vi.spyOn(part, 'dispose');
                disposed.push(part);

                return part;
            });
        }

        expect(first.processAsTexture(AvatarSetType.FULL, false)).not.toBe(second.processAsTexture(AvatarSetType.FULL, false));
        expect(rendering.passes).toBe(2);
        expect(disposed).toHaveLength(6);
        for(const part of disposed) expect(part.dispose).toHaveBeenCalledOnce();
        first.dispose();
        second.dispose();
        cache.dispose();
    });

    it('renders privately when all cache entries are borrowed without overwriting the shared frame', () =>
    {
        const cache = new AvatarFrameTextureCache(1);
        const create = avatarFixture();
        const first = create(cache);
        const second = create(cache);
        const shared = first.processAsTexture(AvatarSetType.FULL, false);

        expect(second.processAsTexture(AvatarSetType.FULL, false)).toBe(shared);
        second.updateAnimationByFrames(1);

        const privateOutput = second.processAsTexture(AvatarSetType.FULL, false);

        expect(privateOutput).not.toBe(shared);
        expect(first.processAsTexture(AvatarSetType.FULL, false)).toBe(shared);
        second.updateAnimationByFrames(3);
        expect(second.processAsTexture(AvatarSetType.FULL, false)).toBe(shared);
        expect(pool.putTexture).toHaveBeenCalledExactlyOnceWith(privateOutput);
        first.dispose();
        second.dispose();
        cache.dispose();
    });

    it.each([['identical', false, 4], ['distinct', true, 2000]] as const)('counts offscreen passes and allocations for 500 %s walking avatars over 12 updates', (label, distinct, coldPasses) =>
    {
        const create = avatarFixture();
        const run = (cache: AvatarFrameTextureCache) =>
        {
            const avatars = Array.from({ length: 500 }, (_, index) => create(cache, distinct ? index + 1 : 0xFFFFFF));
            const startPasses = rendering.passes;
            const startAllocations = rendering.allocations;
            const start = performance.now();

            for(let frame = 0; frame < 12; frame++)
            {
                for(const avatar of avatars)
                {
                    avatar.updateAnimationByFrames(1);
                    avatar.processAsTexture(AvatarSetType.FULL, false);
                }
            }

            const result = { passes: rendering.passes - startPasses, allocations: rendering.allocations - startAllocations, cpuMs: Math.round(performance.now() - start) };

            for(const avatar of avatars) avatar.dispose();

            return result;
        };
        const before = run(null);
        const cache = new AvatarFrameTextureCache();
        const after = run(cache);
        const warm = run(cache);

        console.info(`500 ${label} avatars / 12 updates / 4 walk frames / 90x130 (stub GPU)`, { before, after, warm, retainedMiB: coldPasses * 90 * 130 * 4 / (1024 * 1024) });
        expect(before.passes).toBe(6000);
        expect(before.allocations).toBe(500);
        expect(after.passes).toBe(coldPasses);
        expect(after.allocations).toBe(coldPasses);
        expect(warm.passes).toBe(0);
        expect(warm.allocations).toBe(0);
        cache.dispose();
    });
});


describe('avatar effect lifetime', () =>
{
    it('removes the shared geometry reference when an image is disposed', () =>
    {
        const avatar = avatarFixture()();
        const internals = avatar as any;
        const retained = new Set([avatar]);
        const structure = internals._structure;
        structure.removeDynamicItems = (image: AvatarImage) => retained.delete(image);
        internals._effectListener = { resetEffect: vi.fn() };
        avatar.dispose();
        avatar.dispose();
        expect(retained.size).toBe(0);
        expect(internals._effectListener).toBeNull();
        expect(internals._effectManager).toBeNull();
    });
});

describe('immutable canvas sources', () =>
{
    it('shares frames drawn from a canvas source that is marked immutable', async () =>
    {
        const { markImmutableTextureSource } = await import('@octane/assets');
        const cache = new AvatarFrameTextureCache();
        const canvasTexture = new Texture({ source: new CanvasSource({ resource: document.createElement('canvas') }) });

        textures.push(canvasTexture);
        expect(cache.acquire(composition(canvasTexture), 64, 110)).toBeNull();

        markImmutableTextureSource(canvasTexture.source);

        const first = cache.acquire(composition(canvasTexture), 64, 110);
        const second = cache.acquire(composition(canvasTexture), 64, 110);

        expect(first).not.toBeNull();
        expect(second.texture).toBe(first.texture);
        expect(rendering.passes).toBe(1);
        cache.release(first);
        cache.release(second);
        cache.dispose();
    });
});
