import { Vector3d } from '@nitrots/utils';
import { describe, expect, it } from 'vitest';
import { SizeData } from '../object/visualization/data/SizeData';
import { RoomGeometry } from '../utils/RoomGeometry';
import { OBJECT_ALTITUDE_DEPTH } from './ObjectAltitudeDepth';

// Classic roller (queue_tile1) visualization data, verbatim from the
// converted .nitro (which matches the original SWF): every layer is pushed
// back 0.9 tiles so riders can draw over neighbouring rollers.
const QUEUE_TILE_LAYERS = { 0: { z: -900 }, 1: { z: -899 }, 2: { z: -898 }, 3: { z: -897 } };
const QUEUE_TILE_DIRECTIONS = { 0: { layers: {} }, 2: { layers: {} }, 4: { layers: {} }, 6: { layers: {} } };

const createQueueTileSizeData = () =>
{
    const sizeData = new SizeData(4, 45);

    expect(sizeData.processLayers(QUEUE_TILE_LAYERS)).toBe(true);
    expect(sizeData.processDirections(QUEUE_TILE_DIRECTIONS)).toBe(true);

    return sizeData;
};

// Mirror of the production constant this test guards:
// FurnitureVisualization.DEPTH_MULTIPLIER.
const DEPTH_MULTIPLIER = Math.sqrt(0.5);
const AVATAR_SPRITE_DEFAULT_DEPTH = -0.01;

const createGeometry = () => new RoomGeometry(64, new Vector3d(-135, 30, 0), new Vector3d(11, 11, 5), new Vector3d(-135, 0.5, 0));

// Sort depth exactly as RoomSpriteCanvas.renderObject computes it (minus the
// negligible screen-x and sprite-count tiebreakers). Smaller = drawn later =
// on top.
const sortDepth = (geometry: RoomGeometry, location: Vector3d, relativeDepth: number, altitudeWeight: number = OBJECT_ALTITUDE_DEPTH) =>
{
    const screen = geometry.getScreenPosition(location);

    expect(screen).not.toBeNull();

    return (screen.z - (location.z * altitudeWeight)) + relativeDepth;
};

describe('roller depth sorting', () =>
{
    it('loads the layer z offsets from the asset for every direction', () =>
    {
        const sizeData = createQueueTileSizeData();

        for(const direction of [0, 2, 4, 6])
        {
            expect(sizeData.getLayerZOffset(direction, 0)).toBeCloseTo(0.9, 5);
            expect(sizeData.getLayerZOffset(direction, 3)).toBeCloseTo(0.897, 5);
        }
    });

    it('sorts riders above neighbouring rollers, and rollers above floor objects behind them', () =>
    {
        const geometry = createGeometry();
        const sizeData = createQueueTileSizeData();
        const beltRelativeDepth = sizeData.getLayerZOffset(0, 0) * DEPTH_MULTIPLIER;

        const furniRider = sortDepth(geometry, new Vector3d(6, 5, 0.5), 0);
        const avatarRider = sortDepth(geometry, new Vector3d(6, 5, 0.5), AVATAR_SPRITE_DEFAULT_DEPTH);
        const ownBelt = sortDepth(geometry, new Vector3d(6, 5, 0), beltRelativeDepth);
        const nextBeltCloser = sortDepth(geometry, new Vector3d(7, 5, 0), beltRelativeDepth);
        const nextBeltCloserY = sortDepth(geometry, new Vector3d(6, 6, 0), beltRelativeDepth);
        const floorAvatarBehind = sortDepth(geometry, new Vector3d(5, 5, 0), AVATAR_SPRITE_DEFAULT_DEPTH);

        // riders (elevated by the roller's 0.50 stack height) draw over the
        // roller they stand on AND the adjacent rollers in either axis
        expect(furniRider).toBeLessThan(ownBelt);
        expect(furniRider).toBeLessThan(nextBeltCloser);
        expect(furniRider).toBeLessThan(nextBeltCloserY);
        expect(avatarRider).toBeLessThan(nextBeltCloser);

        // a roller still draws over floor-level objects on the tile behind it
        expect(ownBelt).toBeLessThan(floorAvatarBehind);
    });

    it('documents that the altitude weight is what makes riders clear the next roller', () =>
    {
        const geometry = createGeometry();
        const sizeData = createQueueTileSizeData();
        const beltRelativeDepth = sizeData.getLayerZOffset(0, 0) * DEPTH_MULTIPLIER;

        // with no altitude weighting (the pre-fix behaviour) the next roller
        // wins and paints over the rider - the reported roller glitch
        const riderNoAltitude = sortDepth(geometry, new Vector3d(6, 5, 0.5), 0, 0);
        const nextBelt = sortDepth(geometry, new Vector3d(7, 5, 0), beltRelativeDepth, 0);

        expect(riderNoAltitude).toBeGreaterThan(nextBelt);
    });
});
