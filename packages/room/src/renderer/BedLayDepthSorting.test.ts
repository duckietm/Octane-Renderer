import { Vector3d } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { SizeData } from '../object/visualization/data/SizeData';
import { RoomGeometry } from '../utils/RoomGeometry';

// bed_polyfon (Furniture/bed_polyfon.hab), size 64: layer 0 (frame) z 1030, layers 1 and 3 z 1031 in both
// directions, layer 2 z 0. Footprint 2 wide, 3 long.
const POLYFON_LAYERS = { 0: { z: 1030 } };
const POLYFON_DIRECTIONS = { 0: { layers: { 1: { z: 1031 }, 3: { z: 1031 } } }, 2: { layers: { 1: { z: 1031 }, 3: { z: 1031 } } } };
const POLYFON_LAYER_COUNT = 4;

// Mirrors of the production constants this test guards.
const DEPTH_MULTIPLIER = Math.sqrt(0.5); // FurnitureVisualization.DEPTH_MULTIPLIER
const AVATAR_SPRITE_LAYING_DEPTH = -0.409; // AvatarVisualization, AIR AVATAR_SPRITE_LAYING_DEPTH
const LAY_CANVAS_OFFSET_Z = -0.9; // AIR action_offset_lay.xml, every size and direction

const createGeometry = () => new RoomGeometry(64, new Vector3d(-135, 30, 0), new Vector3d(11, 11, 5), new Vector3d(-135, 0.5, 0));

const createSizeData = () =>
{
    const sizeData = new SizeData(POLYFON_LAYER_COUNT, 45);

    expect(sizeData.processLayers(POLYFON_LAYERS)).toBe(true);
    expect(sizeData.processDirections(POLYFON_DIRECTIONS)).toBe(true);

    return sizeData;
};

// Sort depth as RoomSpriteCanvas.renderObject computes it for objects resting on the floor (the laying avatar's
// altitude weight is its bed's z, 0 here). Smaller = drawn later = on top.
const sortDepth = (geometry: RoomGeometry, location: Vector3d, relativeDepth: number) => geometry.getScreenPosition(location).z + relativeDepth;

// FurnitureVisualization: (layer z offset - layerId * 0.001) * DEPTH_MULTIPLIER.
const bedLayerDepths = (geometry: RoomGeometry, sizeData: SizeData, bed: Vector3d, direction: number) =>
    Array.from({ length: POLYFON_LAYER_COUNT }, (_, layerId) =>
        sortDepth(geometry, bed, (sizeData.getLayerZOffset(direction, layerId) - (layerId * 0.001)) * DEPTH_MULTIPLIER));

// The bed at (4, 6); each lane's pillow on the leading row, the avatar raised by the bed height.
const LANES: Record<number, Vector3d[]> = {
    0: [ new Vector3d(4, 6, 1.73), new Vector3d(5, 6, 1.73) ],
    2: [ new Vector3d(4, 6, 1.73), new Vector3d(4, 7, 1.73) ]
};

describe('a laying avatar against its bed\'s layers', () =>
{
    const geometry = createGeometry();
    const sizeData = createSizeData();
    const bed = new Vector3d(4, 6, 0);

    it.each([ 0, 2 ])('sorts in front of every layer of a rotation %i bed in both lanes', rotation =>
    {
        const layers = bedLayerDepths(geometry, sizeData, bed, rotation);

        for(const pillow of LANES[rotation])
        {
            const avatar = sortDepth(geometry, new Vector3d(pillow.x, pillow.y, 0), AVATAR_SPRITE_LAYING_DEPTH + LAY_CANVAS_OFFSET_Z);

            for(const layer of layers) expect(avatar).toBeLessThan(layer);
        }
    });

    it.each([ 0, 2 ])('documents that without the lay canvas offset the origin lane of a rotation %i bed sorts behind the frame', rotation =>
    {
        const layers = bedLayerDepths(geometry, sizeData, bed, rotation);
        const [ originLane, otherLane ] = LANES[rotation].map(pillow => sortDepth(geometry, new Vector3d(pillow.x, pillow.y, 0), AVATAR_SPRITE_LAYING_DEPTH));

        expect(originLane).toBeGreaterThan(layers[0]);
        for(const layer of layers) expect(otherLane).toBeLessThan(layer);
    });
});
