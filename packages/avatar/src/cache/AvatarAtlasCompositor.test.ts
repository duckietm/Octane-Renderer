import { AvatarAction, AvatarSetType, IActionDefinition, IPartColor } from '@octane/api';
import { ImageSource, Point, Rectangle, RenderTexture, Texture } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AvatarFigureContainer } from '../AvatarFigureContainer';
import { AvatarFigureShare, AvatarImage } from '../AvatarImage';
import { AvatarImageBodyPartContainer, AvatarPartLayer } from '../AvatarImageBodyPartContainer';
import { AvatarImagePartContainer } from '../AvatarImagePartContainer';
import { AvatarRenderManager } from '../AvatarRenderManager';
import { AvatarStructure } from '../AvatarStructure';
import { EffectAssetDownloadManager } from '../EffectAssetDownloadManager';
import { AssetAliasCollection } from '../alias';
import { HabboAvatarGeometry } from '../data/HabboAvatarGeometry';
import { AvatarCanvas } from '../structure';
import { AvatarAtlasCompositor, AvatarAtlasSlot, IAvatarAtlasOwner } from './AvatarAtlasCompositor';
import { AvatarFrameTextureCache } from './AvatarFrameTextureCache';
import { AvatarImageActionCache } from './AvatarImageActionCache';

const rendering = vi.hoisted(() => ({ passes: 0, targets: [] as unknown[] }));
const pool = vi.hoisted(() => ({ getTexture: vi.fn(), putTexture: vi.fn() }));
// Not a WebGLRenderer, so the compositor draws its cells through Pixi's batcher (one render per page).
const renderer = vi.hoisted(() => ({
    render: (options: { target: unknown }) =>
    {
        rendering.passes++;
        rendering.targets.push(options.target);
    },
    renderPipes: {},
    runners: { contextChange: { add: vi.fn(), remove: vi.fn() } }
}));

vi.mock('@octane/utils', async importOriginal => ({
    ...await importOriginal<typeof import('@octane/utils')>(),
    GetRenderer: () => renderer,
    GetTexturePool: () => pool,
    GetTickerTime: () => 100000
}));

let textures: Texture[];

const imageTexture = () =>
{
    const image = new Image(8, 12);
    const texture = new Texture({ source: new ImageSource({ resource: image, width: 8, height: 12 }) });

    textures.push(texture);

    return texture;
};

const owner = (): IAvatarAtlasOwner & { lost: number } => ({
    lost: 0,
    onAtlasContentLost()
    {
        this.lost++;
    }
});

const part = (layers: AvatarPartLayer[]) => ({ part: { layers }, x: 2, y: 3 });

beforeEach(() =>
{
    rendering.passes = 0;
    rendering.targets = [];
    textures = [];
    pool.putTexture.mockReset();
    pool.getTexture.mockReset().mockImplementation((width: number, height: number) =>
    {
        const texture = RenderTexture.create({ width, height });

        textures.push(texture);

        return texture;
    });
});

afterEach(() =>
{
    for(const texture of textures) if(!texture.destroyed) texture.destroy(true);
});

describe('AvatarAtlasCompositor', () =>
{
    it('hands out cells of one page that do not overlap, each inside a gutter', () =>
    {
        const compositor = new AvatarAtlasCompositor();
        const slots = Array.from({ length: 40 }, () => compositor.allocate(64, 110, owner()));
        const page = slots[0].page;
        const frames = slots.map(slot => slot.texture.frame);

        expect(new Set(slots.map(slot => slot.page)).size).toBe(1);

        for(let a = 0; a < frames.length; a++)
        {
            expect(frames[a].width).toBe(64);
            expect(frames[a].height).toBe(110);
            expect(frames[a].x).toBeGreaterThanOrEqual(AvatarAtlasCompositor.GUTTER);
            expect(frames[a].right).toBeLessThanOrEqual(page.texture.width - AvatarAtlasCompositor.GUTTER);
            expect(frames[a].bottom).toBeLessThanOrEqual(page.texture.height - AvatarAtlasCompositor.GUTTER);

            for(let b = (a + 1); b < frames.length; b++)
            {
                const apart = (frames[a].right + 2 <= frames[b].x) || (frames[b].right + 2 <= frames[a].x) || (frames[a].bottom + 2 <= frames[b].y) || (frames[b].bottom + 2 <= frames[a].y);

                expect(apart).toBe(true);
            }
        }

        compositor.dispose();
    });

    it('refuses sizes that do not fit a page and opens a second page when the first is full', () =>
    {
        const compositor = new AvatarAtlasCompositor();

        expect(compositor.allocate(4096, 10, owner())).toBeNull();
        expect(compositor.allocate(0, 10, owner())).toBeNull();

        // 1022 + 2 gutters: four cells a page.
        const slots = Array.from({ length: 5 }, () => compositor.allocate(1022, 1022, owner()));

        expect(new Set(slots.slice(0, 4).map(slot => slot.page)).size).toBe(1);
        expect(slots[4].page).not.toBe(slots[0].page);

        compositor.dispose();
    });

    it('keeps one empty page while it is on and drops every empty page once it is off', () =>
    {
        const compositor = new AvatarAtlasCompositor();
        const slots = Array.from({ length: 5 }, () => compositor.allocate(1022, 1022, owner()));
        const first = slots[0].page.texture;
        const second = slots[4].page.texture;
        const cell = slots[4].texture;

        compositor.release(slots[4]);

        expect(cell.destroyed).toBe(true);
        expect(second.destroyed).toBe(true);

        for(const slot of slots.slice(0, 4)) compositor.release(slot);

        expect(first.destroyed).toBe(false);

        compositor.setKeepEmptyPages(false);

        expect(first.destroyed).toBe(true);

        // Off, the page of a late avatar goes when that avatar leaves.
        const late = compositor.allocate(1022, 1022, owner());
        const latePage = late.page.texture;

        compositor.release(late);

        expect(latePage.destroyed).toBe(true);

        compositor.dispose();
    });

    it('caps the pixels kept for finished frames and gives them back on release', () =>
    {
        const compositor = new AvatarAtlasCompositor();
        const before = AvatarAtlasCompositor.MAX_FRAME_PIXELS;

        AvatarAtlasCompositor.MAX_FRAME_PIXELS = (64 * 110 * 2);

        try
        {
            const a = compositor.allocateFrame(64, 110, owner());
            const b = compositor.allocateFrame(64, 110, owner());

            expect(a).not.toBeNull();
            expect(b).not.toBeNull();
            expect(compositor.allocateFrame(64, 110, owner())).toBeNull();
            // An avatar's own cell does not count.
            expect(compositor.allocate(64, 110, owner())).not.toBeNull();

            compositor.release(a);

            expect(compositor.allocateFrame(64, 110, owner())).not.toBeNull();
        }
        finally
        {
            AvatarAtlasCompositor.MAX_FRAME_PIXELS = before;
            compositor.dispose();
        }
    });

    it('draws every queued cell of a page in one render and reports how many it drew', () =>
    {
        const compositor = new AvatarAtlasCompositor();
        const texture = imageTexture();
        const layers: AvatarPartLayer[] = [{ texture, flipped: false, x: 0, y: 0, tint: 0xFFFFFF }, { texture, flipped: true, x: 8, y: 0, tint: 0xFF0000 }];
        const slots = Array.from({ length: 10 }, () => compositor.allocate(64, 110, owner()));

        expect(compositor.hasPending).toBe(false);

        for(const slot of slots) compositor.queue(slot, [ part(layers) ], 1);

        // Queued twice: only the last part list is drawn, and the cell counts once.
        compositor.queue(slots[0], [ part(layers), part(layers) ], 2);

        expect(compositor.hasPending).toBe(true);
        expect(rendering.passes).toBe(0);

        compositor.flush();

        expect(rendering.passes).toBe(1);
        expect(rendering.targets[0]).toBe(slots[0].page.texture);
        expect(compositor.lastFlushJobs).toBe(10);
        expect(compositor.hasPending).toBe(false);
        expect(slots.every(slot => (slot.pending === null) && !slot.incomplete)).toBe(true);
        // The batch pipe was installed on a renderer that was created before the module loaded.
        expect((renderer.renderPipes as Record<string, unknown>).avatarAtlasBatch).toBeDefined();

        // Nothing waits: the next flush draws nothing and reports nothing.
        compositor.flush();

        expect(rendering.passes).toBe(1);
        expect(compositor.lastFlushJobs).toBe(0);
        expect(compositor.lastFlushMs).toBe(0);

        compositor.dispose();
    });

    it('skips a cancelled or released cell and marks a cell whose part was disposed', () =>
    {
        const compositor = new AvatarAtlasCompositor();
        const texture = imageTexture();
        const layers: AvatarPartLayer[] = [{ texture, flipped: false, x: 0, y: 0, tint: 0xFFFFFF }];
        const [ kept, cancelled, released, broken ] = Array.from({ length: 4 }, () => compositor.allocate(64, 110, owner()));
        const disposed = new AvatarImageBodyPartContainer(layers.slice(), 8, 12, new Point(), true, new Rectangle(0, 0, 8, 12));

        compositor.queue(kept, [ part(layers) ], 1);
        compositor.queue(cancelled, [ part(layers) ], 1);
        compositor.queue(released, [ part(layers) ], 1);
        compositor.queue(broken, [{ part: disposed, x: 0, y: 0 }], 1);

        compositor.cancel(cancelled);
        compositor.release(released);
        disposed.dispose();

        compositor.flush();

        expect(compositor.lastFlushJobs).toBe(2);
        expect(kept.incomplete).toBe(false);
        expect(broken.incomplete).toBe(true);

        // A released cell cannot be queued again.
        compositor.queue(released, [ part(layers) ], 1);

        expect(compositor.hasPending).toBe(false);

        compositor.dispose();
    });

    it('tells every owner to draw again after the context was restored', () =>
    {
        const compositor = new AvatarAtlasCompositor();
        const owners = [ owner(), owner(), owner() ];
        const slots = owners.map(entry => compositor.allocate(64, 110, entry));

        compositor.release(slots[2]);
        compositor.contextChange();

        expect(owners.map(entry => entry.lost)).toEqual([ 1, 1, 0 ]);

        compositor.dispose();
    });
});

// Real AvatarImage and body-part caches over a synthetic structure, as in AvatarFrameTextureCache.test.ts.
// partFrames: one frame is content that only changes with the pose; several plain frames animate on their own.
const avatarFixture = (partFrames: number = 1) =>
{
    const bodyParts = [ 'head', 'body', 'feet' ];
    const assets = new Map<string, object>();
    const definition = (state: string): IActionDefinition => ({
        id: state, state, geometryType: 'vertical',
        assetPartDefinition: state, isMain: state !== AvatarAction.EFFECT, isAnimation: state === AvatarAction.EFFECT,
        startFromFrameZero: false, getPreventHeadTurn: () => false, isAnimated: () => true
    } as unknown as IActionDefinition);
    const structure = {
        getActionDefinition: () => definition('std'),
        getActionDefinitionWithState: (state: string) => definition(state),
        isMainAvatarSet: (set: string) => set === AvatarSetType.FULL,
        getBodyPartsUnordered: (set: string) => set === AvatarSetType.HEAD ? [ 'head' ] : bodyParts,
        getBodyParts: (set: string) => set === AvatarSetType.HEAD ? [ 'head' ] : bodyParts,
        removeDynamicItems: (): void => undefined,
        getActiveBodyPartIds: () => bodyParts,
        getCanvas: (_scale: string, geometry: string) => new AvatarCanvas(HabboAvatarGeometry.geometry.canvases[0].geometries.find(canvas => canvas.id === geometry), 'h'),
        getParts: (partId: string, figure: AvatarFigureContainer, action: { definition: IActionDefinition }) => [
            new AvatarImagePartContainer(partId, partId, '1', { rgb: figure.getPartColorIds('ch')[0] } as IPartColor,
                new Array(partFrames).fill(null), action.definition, true, 0, partId)
        ],
        getFrameBodyPartOffset: () => new Point(),
        sortActions: (actions: { actionType: string; actionParameter: string; definition: IActionDefinition }[]) =>
        {
            for(const action of actions) action.definition = definition(action.actionType === AvatarAction.POSTURE ? action.actionParameter : action.actionType);

            return actions;
        },
        maxFrames: () => 4,
        getCanvasOffsets: () => [ 0, 0, 0 ],
        getAnimation: (): null => null
    } as unknown as AvatarStructure;
    const aliases = {
        getAsset: (name: string) =>
        {
            // Inside the canvas, so every part fits its atlas cell.
            if(!assets.has(name)) assets.set(name, { texture: imageTexture(), rectangle: new Rectangle(0, 0, 8, 12), x: 10, y: -60 });

            return assets.get(name);
        }
    } as unknown as AssetAliasCollection;
    const effectManager = { isAvatarEffectReady: () => true } as unknown as EffectAssetDownloadManager;

    return { structure, aliases, effectManager };
};

const walking = (avatar: AvatarImage): AvatarImage =>
{
    avatar.initActionAppends();
    avatar.appendAction(AvatarAction.POSTURE, AvatarAction.POSTURE_WALK);
    avatar.endActionAppends();

    return avatar;
};

describe('AvatarImage atlas cells', () =>
{
    const create = (frames: AvatarFrameTextureCache, compositor: AvatarAtlasCompositor, share: AvatarFigureShare, fixture = avatarFixture()) =>
    {
        if(share) share.count++;

        return walking(new AvatarImage(fixture.structure, fixture.aliases, new AvatarFigureContainer('ch-1-16777215'), 'h', fixture.effectManager, null, frames, compositor, share));
    };

    const atlasSlots = (avatar: AvatarImage) => avatar as unknown as { _atlasSlot: AvatarAtlasSlot; _frameSlots: AvatarAtlasSlot[]; _spareFrameSlots: AvatarAtlasSlot[] };

    it('draws through the shared frame cache when it has no compositor, deferred or not', () =>
    {
        const frames = new AvatarFrameTextureCache();
        const fixture = avatarFixture();
        const first = create(frames, null, null, fixture);
        const second = create(frames, null, null, fixture);
        const texture = first.processAsTexture(AvatarSetType.FULL, false, true);

        expect(texture).toBeInstanceOf(RenderTexture);
        expect(rendering.passes).toBe(1);
        expect(second.processAsTexture(AvatarSetType.FULL, false, true)).toBe(texture);
        expect(rendering.passes).toBe(1);
        expect(atlasSlots(first)._atlasSlot).toBeNull();
        expect(atlasSlots(first)._frameSlots).toHaveLength(0);

        first.dispose();
        second.dispose();
        frames.dispose();
    });

    it('draws through the shared frame cache with a figure share but no compositor', () =>
    {
        const frames = new AvatarFrameTextureCache();
        const acquire = vi.spyOn(frames, 'acquire');
        const avatar = create(frames, null, { count: 0 });

        expect(avatar.processAsTexture(AvatarSetType.FULL, false, true)).toBeInstanceOf(RenderTexture);
        expect(acquire).toHaveBeenCalledOnce();

        avatar.dispose();
        frames.dispose();
    });

    it('gives a figure nobody else wears atlas cells that are drawn at the flush, and reuses a walk cycle', () =>
    {
        const frames = new AvatarFrameTextureCache();
        const compositor = new AvatarAtlasCompositor();
        const share = { count: 0 };
        const avatar = create(frames, compositor, share);
        const acquire = vi.spyOn(frames, 'acquire');
        const queue = vi.spyOn(compositor, 'queue');
        const cycle: Texture[] = [];

        for(let frame = 0; frame < 4; frame++)
        {
            const revision = avatar.textureRevision;
            const texture = avatar.processAsTexture(AvatarSetType.FULL, false, true);

            // A cell of an atlas page: not drawn yet, and no render texture of the avatar's own.
            expect(texture).not.toBeInstanceOf(RenderTexture);
            expect(avatar.textureRevision).toBe(revision + 1);
            expect(rendering.passes).toBe(0);

            compositor.flush();

            expect(rendering.passes).toBe(1);

            rendering.passes = 0;
            cycle.push(texture);
            avatar.updateAnimationByFrames(1);
        }

        expect(new Set(cycle).size).toBe(4);
        expect(new Set(cycle.map(texture => texture.source)).size).toBe(1);
        expect(queue).toHaveBeenCalledTimes(4);
        expect(acquire).not.toHaveBeenCalled();
        expect(pool.getTexture).not.toHaveBeenCalled();

        // The second time round the walk only swaps between the four kept cells.
        for(let frame = 0; frame < 8; frame++)
        {
            expect(avatar.processAsTexture(AvatarSetType.FULL, false, true)).toBe(cycle[frame % 4]);

            avatar.updateAnimationByFrames(1);
        }

        compositor.flush();

        expect(queue).toHaveBeenCalledTimes(4);
        expect(rendering.passes).toBe(0);

        // Unchanged: the same texture and the same revision.
        const shown = avatar.processAsTexture(AvatarSetType.FULL, false, true);
        const revision = avatar.textureRevision;

        expect(avatar.processAsTexture(AvatarSetType.FULL, false, true)).toBe(shown);
        expect(avatar.textureRevision).toBe(revision);

        const page = cycle[0].source;

        avatar.dispose();

        expect(share.count).toBe(0);
        expect(cycle.every(texture => texture.destroyed)).toBe(true);
        // The page stays for the next avatar.
        expect(page.destroyed).toBe(false);

        compositor.dispose();
        frames.dispose();
    });

    it('redraws content that animates on its own into the one cell of the avatar every frame', () =>
    {
        const compositor = new AvatarAtlasCompositor();
        const avatar = create(null, compositor, { count: 0 }, avatarFixture(4));
        const queue = vi.spyOn(compositor, 'queue');
        const shown = new Set<Texture>();

        for(let frame = 0; frame < 8; frame++)
        {
            shown.add(avatar.processAsTexture(AvatarSetType.FULL, false, true));
            compositor.flush();
            avatar.updateAnimationByFrames(1);
        }

        expect(shown.size).toBe(1);
        expect(queue).toHaveBeenCalledTimes(8);
        expect(atlasSlots(avatar)._atlasSlot.texture).toBe([ ...shown ][0]);
        expect(atlasSlots(avatar)._frameSlots).toHaveLength(0);
        expect(rendering.passes).toBe(8);

        avatar.dispose();
        compositor.dispose();
    });

    it('turns a walking avatar without drawing into a cell another pose still shows', () =>
    {
        const compositor = new AvatarAtlasCompositor();
        const avatar = create(null, compositor, { count: 0 });
        const first = avatar.processAsTexture(AvatarSetType.FULL, false, true);

        compositor.flush();
        avatar.setDirection(AvatarSetType.FULL, 4);

        const turned = avatar.processAsTexture(AvatarSetType.FULL, false, true);

        // The cell of the old pose is drawn over for the new one.
        expect(turned).toBe(first);
        expect(compositor.hasPending).toBe(true);
        expect(atlasSlots(avatar)._frameSlots.filter(slot => !!slot)).toHaveLength(1);

        compositor.flush();
        avatar.dispose();
        compositor.dispose();
    });

    it('leaves the atlas when the texture is needed at once, and comes back when it may wait again', () =>
    {
        const compositor = new AvatarAtlasCompositor();
        const avatar = create(null, compositor, { count: 0 });
        const cell = avatar.processAsTexture(AvatarSetType.FULL, false, true);

        compositor.flush();
        rendering.passes = 0;
        avatar.updateAnimationByFrames(1);

        const immediate = avatar.processAsTexture(AvatarSetType.FULL, false);

        // Drawn before the call returned, into a texture of the avatar's own.
        expect(immediate).toBeInstanceOf(RenderTexture);
        expect(immediate).not.toBe(cell);
        expect(rendering.passes).toBe(1);
        expect(rendering.targets.at(-1)).toBe(immediate);

        avatar.updateAnimationByFrames(1);

        const deferred = avatar.processAsTexture(AvatarSetType.FULL, false, true);

        expect(deferred).not.toBeInstanceOf(RenderTexture);
        expect(pool.putTexture).toHaveBeenCalledWith(immediate);

        avatar.dispose();
        compositor.dispose();
    });

    it('keeps a figure that several avatars wear in the shared frame cache', () =>
    {
        const frames = new AvatarFrameTextureCache();
        const compositor = new AvatarAtlasCompositor();
        const share = { count: 0 };
        const fixture = avatarFixture();
        const first = create(frames, compositor, share, fixture);
        const second = create(frames, compositor, share, fixture);
        const texture = first.processAsTexture(AvatarSetType.FULL, false, true);

        expect(texture).toBeInstanceOf(RenderTexture);
        expect(second.processAsTexture(AvatarSetType.FULL, false, true)).toBe(texture);
        expect(compositor.hasPending).toBe(false);

        // The other one left: the figure is worn once, so the next frame moves into the atlas.
        second.dispose();
        first.updateAnimationByFrames(1);

        expect(first.processAsTexture(AvatarSetType.FULL, false, true)).not.toBeInstanceOf(RenderTexture);
        expect(compositor.hasPending).toBe(true);

        first.dispose();
        compositor.dispose();
        frames.dispose();
    });

    it('draws its cells again after the context was restored', () =>
    {
        const compositor = new AvatarAtlasCompositor();
        const avatar = create(null, compositor, { count: 0 });
        const queue = vi.spyOn(compositor, 'queue');

        avatar.processAsTexture(AvatarSetType.FULL, false, true);
        compositor.flush();

        expect(queue).toHaveBeenCalledTimes(1);

        compositor.contextChange();
        avatar.processAsTexture(AvatarSetType.FULL, false, true);

        expect(queue).toHaveBeenCalledTimes(2);

        avatar.dispose();
        compositor.dispose();
    });
});

describe('AvatarRenderManager atlas switch', () =>
{
    const managerFixture = () =>
    {
        const manager = new AvatarRenderManager();
        const fixture = avatarFixture();

        Object.assign(manager, {
            _structure: fixture.structure, _aliasCollection: fixture.aliases, _effectAssetDownloadManager: fixture.effectManager,
            _avatarAssetDownloadManager: { isAvatarFigureContainerReady: () => true, dispose: (): void => undefined }
        });

        return manager;
    };

    const internals = (avatar: unknown) => avatar as { _compositor: AvatarAtlasCompositor; _figureShare: AvatarFigureShare };

    afterEach(() =>
    {
        AvatarImageActionCache.MAX_DIRECTIONS = AvatarImageActionCache.ATLAS_MAX_DIRECTIONS;
    });

    it('is on by default, as in Volt, with all eight directions kept per action', () =>
    {
        expect(managerFixture().atlasEnabled).toBe(true);
        expect(AvatarImageActionCache.MAX_DIRECTIONS).toBe(AvatarImageActionCache.ATLAS_MAX_DIRECTIONS);
    });

    it('gives every placeholder the shared frames, the compositor and one counted figure share', () =>
    {
        const manager = managerFixture();
        const first = manager.createPlaceholderAvatarImage('h');
        const second = manager.createPlaceholderAvatarImage('h');

        expect(first.isPlaceholder()).toBe(true);
        expect(internals(first)._compositor).toBeInstanceOf(AvatarAtlasCompositor);
        expect(internals(first)._figureShare).toBe(internals(second)._figureShare);
        expect(internals(first)._figureShare.count).toBe(2);
        expect((first as unknown as { _frameTextures: unknown })._frameTextures).toBe((manager as unknown as { _frameTextures: unknown })._frameTextures);

        second.dispose();

        expect(internals(first)._figureShare.count).toBe(1);

        manager.atlasEnabled = false;

        const late = manager.createPlaceholderAvatarImage('h');

        expect(internals(late)._compositor).toBeNull();
        expect(internals(late)._figureShare).toBeNull();

        for(const avatar of [ first, late ]) avatar.dispose();
    });

    it('switched off: new avatar images get no compositor and no figure share', () =>
    {
        const manager = managerFixture();

        manager.atlasEnabled = false;

        const avatar = manager.createAvatarImage('ch-1-16777215', 'h', null);

        expect(manager.atlasEnabled).toBe(false);
        expect(internals(avatar)._compositor).toBeNull();
        expect(internals(avatar)._figureShare).toBeNull();
        expect(AvatarImageActionCache.MAX_DIRECTIONS).toBe(3);
        expect(manager.lastCompositionFlushJobs).toBe(0);
        expect(manager.lastCompositionFlushMs).toBe(0);
        expect(() => manager.flushCompositions()).not.toThrow();

        avatar.dispose();
    });

    it('hands the compositor and a counted figure share to images created while it is on', () =>
    {
        const manager = managerFixture();

        manager.atlasEnabled = true;

        const first = manager.createAvatarImage('ch-1-16777215', 'h', null);
        const second = manager.createAvatarImage('ch-1-16777215', 'h', null);
        const other = manager.createAvatarImage('ch-1-255', 'h', null);
        const small = manager.createAvatarImage('ch-1-16777215', 'sh', null);

        expect(AvatarImageActionCache.MAX_DIRECTIONS).toBe(8);
        expect(internals(first)._compositor).toBeInstanceOf(AvatarAtlasCompositor);
        expect(internals(first)._figureShare).toBe(internals(second)._figureShare);
        expect(internals(first)._figureShare.count).toBe(2);
        expect(internals(other)._figureShare.count).toBe(1);
        expect(internals(small)._figureShare.count).toBe(1);

        second.dispose();

        expect(internals(first)._figureShare.count).toBe(1);

        manager.atlasEnabled = false;

        const late = manager.createAvatarImage('ch-1-16777215', 'h', null);

        expect(internals(late)._compositor).toBeNull();
        expect(AvatarImageActionCache.MAX_DIRECTIONS).toBe(3);

        for(const avatar of [ first, other, small, late ]) avatar.dispose();
    });

    it('reports the last flush of its compositor', () =>
    {
        const manager = managerFixture();

        manager.atlasEnabled = true;

        const avatar = walking(manager.createAvatarImage('ch-1-16777215', 'h', null) as AvatarImage);

        avatar.processAsTexture(AvatarSetType.FULL, false, true);

        expect(rendering.passes).toBe(0);

        manager.flushCompositions();

        expect(rendering.passes).toBe(1);
        expect(manager.lastCompositionFlushJobs).toBe(1);
        expect(manager.lastCompositionFlushMs).toBeGreaterThanOrEqual(0);

        avatar.dispose();
    });
});
