import { IRoomObject, IRoomObjectSprite, IRoomObjectSpriteVisualization } from '@nitrots/api';
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

vi.mock('@nitrots/utils', () => ({
    GetTicker: () => ({ deltaTime: 1 }),
    TextureUtils: {},
    Vector3d: TestVector3d
}));

vi.mock('@nitrots/configuration', () => ({
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
