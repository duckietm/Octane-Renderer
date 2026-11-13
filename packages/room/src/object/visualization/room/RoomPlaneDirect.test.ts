import { GetTexturePool, TextureUtils, Vector3d } from '@octane/utils';
import { Rectangle, Texture, TextureSource } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlaneMaskManager, RoomGeometry, RoomObjectSprite, RoomPlane, RoomPlaneContainsPoint } from '@octane/room';

const { rendererState, tileTexture } = vi.hoisted(() => ({ rendererState: { value: null }, tileTexture: { value: null } }));

vi.mock('@octane/utils', async importOriginal => ({
    ...(await importOriginal<object>()),
    GetRenderer: () => rendererState.value
}));

const roomVisualization = {
    floorData: {
        planes: [ { id: '101', visualizations: [ { size: 64, allLayers: [ { materialId: 'floor_mat', color: 0xD0D0D0 } ] } ] } ],
        materials: [ { id: 'floor_mat', matrices: [ { columns: [ { width: 64, cells: [ { textureId: 'floor_tex' } ] } ] } ] } ],
        textures: [ { id: 'floor_tex', bitmaps: [ { assetName: 'floor_tile' } ] } ]
    },
    wallData: {
        planes: [ { id: '101', visualizations: [ { size: 64, allLayers: [ { materialId: 'floor_mat', color: 0xFFFFFF } ] } ] } ],
        materials: [ { id: 'floor_mat', matrices: [ { columns: [ { width: 64, cells: [ { textureId: 'floor_tex' } ] } ] } ] } ],
        textures: [ { id: 'floor_tex', bitmaps: [ { assetName: 'floor_tile' } ] } ]
    }
};

vi.mock('@octane/assets', async importOriginal => ({
    ...(await importOriginal<object>()),
    GetAssetManager: () => ({
        getCollection: (name: string) => ((name === 'room') ? {
            name: 'room',
            data: { roomVisualization },
            getAsset: (assetName: string) => ((assetName === 'floor_tile') ? { texture: tileTexture.value } : null),
            getTexture: () => null
        } : null)
    })
}));

const geometry = () => new RoomGeometry(64, new Vector3d(-135, 30, 0), new Vector3d(11, 11, 5));

const floor = () =>
{
    const plane = new RoomPlane(new Vector3d(), new Vector3d(0, 0, 0), new Vector3d(4, 0, 0), new Vector3d(0, 3, 0), RoomPlane.TYPE_FLOOR, true, [], 1);

    plane.id = '101';
    plane.color = 0xFFFFFF;

    return plane;
};

const wall = () =>
{
    const plane = new RoomPlane(new Vector3d(), new Vector3d(), new Vector3d(4, 0, 0), new Vector3d(0, 0, -3), RoomPlane.TYPE_WALL, true, [], 1);

    plane.id = '101';
    plane.color = 0xFFFFFF;
    // A door: drawn as a black rectangle the mask filter cuts out.
    plane.maskManager = new PlaneMaskManager();
    plane.addRectangleMask(2, 0, 1, 2);

    return plane;
};

describe('RoomPlane direct drawing (room.planes.direct)', () =>
{
    beforeEach(() =>
    {
        rendererState.value = { render: vi.fn() };
        tileTexture.value = new Texture({ source: new TextureSource({ width: 8, height: 8 }) });
    });

    afterEach(() =>
    {
        RoomPlane.DIRECT_DRAW = false;
        vi.restoreAllMocks();
    });

    it('is off by default and keeps the full-plane bake', () =>
    {
        expect(RoomPlane.DIRECT_DRAW).toBe(false);

        const plane = floor();

        expect(plane.update(geometry(), 0, true)).toBe(true);
        expect(plane.planeTexture).not.toBeNull();
        expect(plane.drawData).toBeNull();
        expect(plane.patchRects).toEqual([]);
    });

    it('draws a floor from its tile without a plane texture', () =>
    {
        RoomPlane.DIRECT_DRAW = true;

        const plane = floor();

        expect(plane.update(geometry(), 0, true)).toBe(true);
        expect(plane.planeTexture).toBeNull();

        const data = plane.drawData;

        expect(data.direct).toBe(true);
        expect(data.width).toBeGreaterThan(0);
        expect(data.height).toBeGreaterThan(0);
        expect(data.tileTexture).toBe(tileTexture.value);
        expect(data.patches).toEqual([]);
        expect(data.blackIsTransparent).toBe(false);
        // Nothing baked.
        expect(rendererState.value.render).not.toHaveBeenCalled();

        // A static plane is not rebuilt.
        const version = data.version;

        expect(plane.update(geometry(), 10)).toBe(false);
        expect(data.version).toBe(version);
    });

    it('bakes only the area around a mask, as a patch', () =>
    {
        RoomPlane.DIRECT_DRAW = true;

        const plane = wall();

        plane.update(geometry(), 0, true);

        const data = plane.drawData;

        expect(data.direct).toBe(true);
        expect(data.blackIsTransparent).toBe(true);
        expect(data.patches).toHaveLength(1);

        const patch = data.patches[0];

        expect(patch.width * patch.height).toBeLessThan(data.width * data.height);
        expect(patch.x + patch.width).toBeLessThanOrEqual(data.width);
        expect(patch.y + patch.height).toBeLessThanOrEqual(data.height);
        expect(patch.texture.width).toBe(patch.width);
        // The patch was drawn through the plane's skew, moved to its corner.
        expect(rendererState.value.render).toHaveBeenCalledWith(expect.objectContaining({ target: patch.texture, clear: true }));
    });

    it('gives the camera scene the same drawing data in both modes', () =>
    {
        const bake = wall();

        bake.update(geometry(), 0, true);

        RoomPlane.DIRECT_DRAW = true;

        const direct = wall();

        direct.update(geometry(), 0, true);

        expect(JSON.stringify(direct.getDrawingDatas(geometry()))).toBe(JSON.stringify(bake.getDrawingDatas(geometry())));
    });

    it('lets go of the patches of a plane that cannot be seen, and builds them again', () =>
    {
        RoomPlane.DIRECT_DRAW = true;

        const plane = wall();

        plane.update(geometry(), 0, true);

        const patch = plane.drawData.patches[0].texture;

        plane.canBeVisible = false;
        plane.update(geometry(), 1);

        expect(plane.drawData.patches).toEqual([]);
        // Destroyed a frame late: a canvas display may still draw it this frame.
        GetTexturePool().flushReleased();
        expect(patch.destroyed).toBe(false);
        GetTexturePool().flushReleased();
        expect(patch.destroyed).toBe(true);

        plane.canBeVisible = true;

        expect(plane.update(geometry(), 2)).toBe(true);
        expect(plane.drawData.patches).toHaveLength(1);
    });

    it('merges overlapping patches and gives up past the shader limit', () =>
    {
        expect(RoomPlane.mergePatchRects([ new Rectangle(0, 0, 10, 10), new Rectangle(5, 5, 10, 10), new Rectangle(40, 40, 2, 2) ])).toEqual([ new Rectangle(0, 0, 15, 15), new Rectangle(40, 40, 2, 2) ]);
        expect(RoomPlane.mergePatchRects(Array.from({ length: 9 }, (_, i) => new Rectangle(i * 10, 0, 2, 2)))).toBeNull();
    });

    it('hit tests the tile outside patches and the baked pixels inside them', () =>
    {
        RoomPlane.DIRECT_DRAW = true;

        const plane = wall();

        plane.update(geometry(), 0, true);

        const data = plane.drawData;
        const patch = data.patches[0];

        vi.spyOn(TextureUtils, 'getPixels').mockImplementation((options: unknown) =>
        {
            // The patch: transparent (the door hole). The tile (through a sprite): opaque.
            if(options instanceof Texture) return { pixels: new Uint8ClampedArray(patch.width * patch.height * 4), width: patch.width, height: patch.height };

            return { pixels: new Uint8ClampedArray(8 * 8 * 4).fill(255), width: 8, height: 8 };
        });

        const inside = { x: patch.x + (patch.width / 2), y: patch.y + (patch.height / 2) };

        expect(RoomPlaneContainsPoint(data, inside.x, inside.y, 128)).toBe(false);
        expect(RoomPlaneContainsPoint(data, inside.x, inside.y, 0)).toBe(true);
        expect(RoomPlaneContainsPoint(data, -1, 0, 0)).toBe(false);
        expect(RoomPlaneContainsPoint(data, data.width, 0, 0)).toBe(false);

        // Somewhere on the wall outside the patch.
        let found = false;

        for(let y = 0; (y < data.height) && !found; y += 2)
        {
            for(let x = 0; x < data.width; x += 2)
            {
                if((x >= patch.x) && (x < (patch.x + patch.width)) && (y >= patch.y) && (y < (patch.y + patch.height))) continue;

                if(RoomPlaneContainsPoint(data, x, y, 128))
                {
                    found = true; break;
                }
            }
        }

        expect(found).toBe(true);
        expect(RoomPlaneContainsPoint(data, 0, 0, 256)).toBe(false);
    });
});

describe('RoomObjectSprite plane draw data', () =>
{
    it('takes its size from the draw data and counts an update per new version', () =>
    {
        const sprite = new RoomObjectSprite();
        const data = { version: 1, width: 120, height: 80 } as RoomObjectSprite['planeDrawData'];
        const counter = sprite.updateCounter;

        sprite.planeDrawData = data;
        sprite.texture = Texture.EMPTY;

        expect(sprite.width).toBe(120);
        expect(sprite.height).toBe(80);
        expect(sprite.updateCounter).toBe(counter + 2);

        sprite.planeDrawData = data;
        expect(sprite.updateCounter).toBe(counter + 2);

        data.version++;
        sprite.planeDrawData = data;
        expect(sprite.updateCounter).toBe(counter + 3);
    });
});
