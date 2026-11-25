import { IRoomObject, IRoomObjectSprite, IRoomObjectSpriteVisualization } from '@octane/api';
import { describe, expect, it, vi } from 'vitest';
import { RoomObjectCache } from './cache';
import { RoomSpriteCanvas } from './RoomSpriteCanvas';

const { TestVector3d } = vi.hoisted(() => ({
    TestVector3d: class
    {
        constructor(public x: number = 0, public y: number = 0, public z: number = 0)
        {}

        public assign(vector: { x: number; y: number; z: number }): void
        {
            this.x = vector.x;
            this.y = vector.y;
            this.z = vector.z;
        }
    }
}));

vi.mock('@octane/utils', () => ({
    GetTicker: () => ({ deltaTime: 1 }),
    TextureUtils: {},
    Vector3d: TestVector3d
}));

vi.mock('@octane/configuration', () => ({
    GetConfiguration: () => ({ getValue: (_key: string, fallback: unknown) => fallback })
}));

vi.mock('../utils', () => ({
    RoomEnterEffect: { isVisualizationOn: () => false },
    RoomGeometry: class
    {},
    RoomRotatingEffect: {},
    RoomShakingEffect: {}
}));

describe('RoomSpriteCanvas', () =>
{
    it('keeps a furniture badge layer in front of its base layer', () =>
    {
        const baseSprite = createSprite('', 0);
        const badgeSprite = createSprite('BADGE', -(0.001 * Math.sqrt(0.5)));
        const visualization = {
            instanceId: 1,
            updateSpriteCounter: 1,
            sprites: [baseSprite, badgeSprite],
            update: vi.fn()
        } as unknown as IRoomObjectSpriteVisualization;
        const object = {
            instanceId: 1,
            updateCounter: 1,
            visualization,
            model: { getValue: () => Number.NaN },
            getLocation: () => new TestVector3d(0, 0, 0)
        } as unknown as IRoomObject;
        const canvas = Object.create(RoomSpriteCanvas.prototype) as RoomSpriteCanvas & Record<string, unknown>;

        Object.assign(canvas, {
            _objectCache: new RoomObjectCache(''),
            _geometry: {
                updateId: 1,
                getScreenPosition: () => new TestVector3d(0, 0, 0)
            },
            _width: 100,
            _height: 100,
            _screenOffsetX: 0,
            _screenOffsetY: 0,
            _noSpriteVisibilityChecking: true,
            _sortableSprites: []
        });

        const spriteCount = (canvas as any).renderObject(object, 0, true, false, 0);
        const [baseSortable, badgeSortable] = (canvas as any)._sortableSprites;

        expect(spriteCount).toBe(2);
        expect(badgeSortable.z).toBeLessThan(baseSortable.z);
    });
});

const createSprite = (tag: string, relativeDepth: number): IRoomObjectSprite => ({
    visible: true,
    texture: {
        source: {},
        width: 39,
        height: 39
    },
    offsetX: 0,
    offsetY: 0,
    flipH: false,
    flipV: false,
    spriteType: 1,
    libraryAssetName: '',
    tag,
    relativeDepth
} as unknown as IRoomObjectSprite);

describe('RoomSpriteCanvas depth sorting', () =>
{
    const setup = () =>
    {
        const first = createSprite('', 0);
        const second = createSprite('', -0.5);
        const visualization = {
            instanceId: 1,
            updateSpriteCounter: 1,
            sprites: [ first, second ],
            update: vi.fn()
        } as unknown as IRoomObjectSpriteVisualization & { updateSpriteCounter: number };
        const object = {
            instanceId: 1,
            updateCounter: 1,
            visualization,
            model: { getValue: () => Number.NaN },
            getLocation: () => new TestVector3d(0, 0, 0)
        } as unknown as IRoomObject;
        const canvas = Object.create(RoomSpriteCanvas.prototype);

        Object.assign(canvas, {
            _objectCache: new RoomObjectCache(''),
            _geometry: { updateId: 1, getScreenPosition: () => new TestVector3d(0, 0, 0) },
            _width: 100,
            _height: 100,
            _screenOffsetX: 0,
            _screenOffsetY: 0,
            _noSpriteVisibilityChecking: true,
            _sortableSprites: [],
            _sortableSpritesDirty: false
        });

        const render = () => canvas.renderObject(object, 0, true, false, 0);

        return { canvas, render, second, visualization };
    };

    it('marks the list dirty for new sprites, but not for a re-render that changes nothing', () =>
    {
        const { canvas, render } = setup();

        render();
        expect(canvas._sortableSpritesDirty).toBe(true);

        canvas._sortableSpritesDirty = false;
        render();
        expect(canvas._sortableSpritesDirty).toBe(false);
    });

    it('marks the list dirty when a depth changes or a sprite goes', () =>
    {
        const { canvas, render, second } = setup();

        render();
        canvas._sortableSpritesDirty = false;

        (second as any).relativeDepth = 0.5;
        render();
        expect(canvas._sortableSpritesDirty).toBe(true);

        canvas._sortableSpritesDirty = false;
        (second as any).visible = false;
        render();
        expect(canvas._sortableSpritesDirty).toBe(true);
    });
});

describe('RoomSpriteCanvas masks', () =>
{
    const setup = async () =>
    {
        const { Container, Graphics } = await import('pixi.js');
        const master = new Container();
        const display = master.addChild(new Container());
        const viewport = master.addChild(new Graphics().rect(0, 0, 100, 100).fill(0xFFFFFF));
        const boundary = master.addChild(new Graphics());
        const canvas = Object.create(RoomSpriteCanvas.prototype);

        Object.assign(canvas, { _master: master, _display: display, _mask: viewport, _boundaryMask: boundary });

        return { canvas, display, viewport, boundary };
    };

    it('hides the viewport rectangle once the boundary mask replaces it', async () =>
    {
        const { canvas, display, viewport, boundary } = await setup();

        canvas.setDisplayMask(viewport);
        canvas.setDisplayMask(boundary);

        // Pixi builds a replaced stencil mask again, as a plain white rectangle over the room.
        expect(viewport.includeInBuild).toBe(true);
        expect(viewport.visible).toBe(false);
        expect(boundary.visible).toBe(true);
        expect(display.mask).toBe(boundary);
    });

    it('shows the viewport mask again when it comes back, and hides both when masking is off', async () =>
    {
        const { canvas, display, viewport, boundary } = await setup();

        canvas.setDisplayMask(boundary);
        canvas.setDisplayMask(viewport);

        expect(viewport.visible).toBe(true);
        expect(boundary.visible).toBe(false);
        expect(display.mask).toBe(viewport);

        canvas.setDisplayMask(null);

        expect(viewport.visible).toBe(false);
        expect(boundary.visible).toBe(false);
        expect(display.mask).toBeFalsy();
    });
});

describe('RoomSpriteCanvas sprite loop', () =>
{
    const setup = (sprites: IRoomObjectSprite[]) =>
    {
        const visualization = {
            instanceId: 7,
            updateSpriteCounter: 1,
            sprites,
            update: vi.fn()
        } as unknown as IRoomObjectSpriteVisualization & { updateSpriteCounter: number };
        const object = {
            id: 42,
            instanceId: 7,
            updateCounter: 1,
            visualization,
            model: { getValue: () => Number.NaN },
            getLocation: () => new TestVector3d(0, 0, 0)
        } as unknown as IRoomObject;
        const canvas = Object.create(RoomSpriteCanvas.prototype);

        Object.assign(canvas, {
            _objectCache: new RoomObjectCache(''),
            _geometry: { updateId: 1, getScreenPosition: () => new TestVector3d(0, 0, 0) },
            _width: 100,
            _height: 100,
            _screenOffsetX: 0,
            _screenOffsetY: 0,
            _noSpriteVisibilityChecking: true,
            _sortableSprites: [],
            _sortableSpritesDirty: false
        });

        return { canvas, object, visualization };
    };

    it('keys the object cache by instance id and names each sortable sprite after it', () =>
    {
        const { canvas, object } = setup([ createSprite('', 0) ]);

        canvas.renderObject(object, 0, true, false, 0);

        expect(canvas._objectCache.getObjectCache(7).sprites.spriteCount).toBe(1);
        expect(canvas._sortableSprites[0].name).toBe('7');

        canvas.removeFromCache('7');

        expect(canvas._objectCache.getObjectCache(7).sprites.spriteCount).toBe(0);
    });

    it('names an avatar sprite once and keeps the name it already has', () =>
    {
        const avatar = Object.assign(createSprite('', 0), { spriteType: 3 });
        const { canvas, object, visualization } = setup([ avatar ]);
        const setter = vi.fn();
        let name = '';

        Object.defineProperty(avatar, 'libraryAssetName', { get: () => name, set: (value: string) =>
        {
            setter(value);
            name = value;
        } });

        canvas.renderObject(object, 0, true, false, 0);
        visualization.updateSpriteCounter++;
        canvas.renderObject(object, 0, true, false, 0);

        expect(name).toBe('avatar_42');
        expect(setter).toHaveBeenCalledTimes(1);
    });

    it('breaks depth ties by the running sprite count', () =>
    {
        const { canvas, object } = setup([ createSprite('', 0) ]);

        canvas.renderObject(object, 0, true, false, 3);

        expect(canvas._sortableSprites[0].z).toBeCloseTo(3 * 3.7E-11, 20);
    });
});

describe('RoomSpriteCanvas sprite pool', () =>
{
    it('gives a pooled sprite the room sprite scale and flips, not the scale it had before', async () =>
    {
        const { Container, Texture } = await import('pixi.js');
        const { ExtendedSprite } = await import('./utils/ExtendedSprite');
        const pooled = new ExtendedSprite();

        pooled.scale.set(-1, -1);

        const canvas = Object.create(RoomSpriteCanvas.prototype);

        Object.assign(canvas, { _display: new Container(), _spritePool: [ pooled ], _spriteCount: 0, _activeSpriteCount: 0 });

        const sprite = Object.assign(createSprite('', 0), { texture: Texture.WHITE, scale: 0.5, flipH: true, flipV: false, alpha: 255, color: 0xFFFFFF, blendMode: 'normal', filters: null, planeDrawData: null });

        canvas.createAndAddSprite({ sprite, x: 0, y: 0, name: '1' });

        expect(pooled.scale.x).toBe(-0.5);
        expect(pooled.scale.y).toBe(0.5);
    });

    it('detaches and destroys every sprite at once when the whole display is cleared', async () =>
    {
        const { Container } = await import('pixi.js');
        const { ExtendedSprite } = await import('./utils/ExtendedSprite');
        const display = new Container();
        const sprites = [ new ExtendedSprite(), new ExtendedSprite(), new ExtendedSprite() ];

        for(const sprite of sprites) display.addChild(sprite);

        const canvas = Object.create(RoomSpriteCanvas.prototype);

        Object.assign(canvas, { _display: display, _spriteCount: 3, _activeSpriteCount: 3 });

        const removeChildAt = vi.spyOn(display, 'removeChildAt');
        const removeChild = vi.spyOn(display, 'removeChild');

        canvas.cleanSprites(0, true);

        expect(display.children.length).toBe(0);
        expect(sprites.every(sprite => sprite.destroyed)).toBe(true);
        expect(removeChildAt).not.toHaveBeenCalled();
        expect(removeChild).not.toHaveBeenCalled();
    });

    it('lets an idle sprite go of its filters and texture', async () =>
    {
        const { Container, Filter } = await import('pixi.js');
        const { ExtendedSprite } = await import('./utils/ExtendedSprite');
        const display = new Container();
        const sprite = new ExtendedSprite();
        const filters = [ new Filter({ glProgram: null, resources: {} }) ];

        sprite.setFilters(filters);
        display.addChild(sprite);

        const canvas = Object.create(RoomSpriteCanvas.prototype);

        Object.assign(canvas, { _display: display, _spriteCount: 1, _activeSpriteCount: 1 });

        canvas.cleanSprites(0);

        expect(sprite.filters ?? null).toBeNull();
        expect(sprite.destroyed).toBe(false);
    });
});
