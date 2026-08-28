import { Vector3d } from '@nitrots/utils';
import { describe, expect, it } from 'vitest';
import { SizeData } from '../object/visualization/data/SizeData';
import { RoomGeometry } from '../utils/RoomGeometry';

// Throne sofa (hcsohva) visualization data, verbatim from the converted
// .nitro: a 2x1 seat whose front arm (layer 3) is pushed a whole tile forward
// so it paints over whoever sits on the second tile.
const SOFA_LAYERS = { 0: { z: -1 }, 1: { z: 30 }, 2: { z: 999 }, 3: { z: 1030 } };
const SOFA_DIRECTIONS = { 0: { layers: {} }, 2: { layers: {} }, 4: { layers: {} }, 6: { layers: {} } };

const createSofaSizeData = () => {
    const sizeData = new SizeData(4, 45);

    expect(sizeData.processLayers(SOFA_LAYERS)).toBe(true);
    expect(sizeData.processDirections(SOFA_DIRECTIONS)).toBe(true);

    return sizeData;
};

// Mirrors of the production constants this test guards:
// RoomSpriteCanvas.OBJECT_ALTITUDE_DEPTH and FurnitureVisualization.DEPTH_MULTIPLIER.
const OBJECT_ALTITUDE_DEPTH = 0.2;
const DEPTH_MULTIPLIER = Math.sqrt(0.5);
const AVATAR_SPRITE_DEFAULT_DEPTH = -0.01;

const createGeometry = () => new RoomGeometry(64, new Vector3d(-135, 30, 0), new Vector3d(11, 11, 5), new Vector3d(-135, 0.5, 0));

// Sort depth exactly as RoomSpriteCanvas.renderObject computes it (minus the
// negligible screen-x and sprite-count tiebreakers). Smaller = drawn later =
// on top.
const sortDepth = (geometry: RoomGeometry, location: Vector3d, relativeDepth: number, altitudeWeight: number) => {
    const screen = geometry.getScreenPosition(location);

    expect(screen).not.toBeNull();

    return (screen.z - (location.z * altitudeWeight)) + relativeDepth;
};

const layerDepth = (geometry: RoomGeometry, sizeData: SizeData, layerId: number) =>
    sortDepth(geometry, new Vector3d(8, 5, 0), ((sizeData.getLayerZOffset(0, layerId) - (layerId * 0.001)) * DEPTH_MULTIPLIER), 0);

describe('seated avatar depth sorting', () => {
    it('keeps a sitter behind the seat front and over the seat back', () => {
        const geometry = createGeometry();
        const sizeData = createSofaSizeData();

        // a sitter is not altitude-weighted: it has to sort against the layers
        // of the very furniture holding it up
        const sitter = sortDepth(geometry, new Vector3d(9, 5, 1), AVATAR_SPRITE_DEFAULT_DEPTH, 0);

        expect(layerDepth(geometry, sizeData, 3)).toBeLessThan(sitter);
        expect(sitter).toBeLessThan(layerDepth(geometry, sizeData, 2));
        expect(sitter).toBeLessThan(layerDepth(geometry, sizeData, 1));
        expect(sitter).toBeLessThan(layerDepth(geometry, sizeData, 0));
    });

    it('documents that altitude weighting would paint the sitter over the whole seat', () => {
        const geometry = createGeometry();
        const sizeData = createSofaSizeData();

        const weightedSitter = sortDepth(geometry, new Vector3d(9, 5, 1), AVATAR_SPRITE_DEFAULT_DEPTH, OBJECT_ALTITUDE_DEPTH);

        // 0.2 per seat height dwarfs the 0.006 that separates the sitter from
        // the front arm, so every layer of the sofa ends up behind the avatar
        expect(weightedSitter).toBeLessThan(layerDepth(geometry, sizeData, 3));
    });
});
