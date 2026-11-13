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

        const spriteCount = (canvas as any).renderObject(object, '1', 0, true, false, 0);
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

        const render = () => canvas.renderObject(object, '1', 0, true, false, 0);

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
