import { AvatarAction, IRoomObject, RoomObjectVariable } from '@nitrots/api';
import { Vector3d } from '@nitrots/utils';
import { describe, expect, it } from 'vitest';
import { SizeData } from '../object/visualization/data/SizeData';
import { RoomGeometry } from '../utils/RoomGeometry';
import { getObjectAltitudeDepth } from './ObjectAltitudeDepth';

// Throne sofa (hcsohva) visualization data, verbatim from the converted
// .nitro: a 2x1 seat whose front arm (layer 3) is pushed a whole tile forward
// so it paints over whoever sits on the second tile.
const SOFA_LAYERS = { 0: { z: -1 }, 1: { z: 30 }, 2: { z: 999 }, 3: { z: 1030 } };
const SOFA_DIRECTIONS = { 0: { layers: {} }, 2: { layers: {} }, 4: { layers: {} }, 6: { layers: {} } };
const SEAT_HEIGHT = 1;

const createSofaSizeData = () => {
    const sizeData = new SizeData(4, 45);

    expect(sizeData.processLayers(SOFA_LAYERS)).toBe(true);
    expect(sizeData.processDirections(SOFA_DIRECTIONS)).toBe(true);

    return sizeData;
};

// Mirror of the production constant this test guards:
// FurnitureVisualization.DEPTH_MULTIPLIER.
const DEPTH_MULTIPLIER = Math.sqrt(0.5);
const AVATAR_SPRITE_DEFAULT_DEPTH = -0.01;

const createGeometry = () => new RoomGeometry(64, new Vector3d(-135, 30, 0), new Vector3d(11, 11, 5), new Vector3d(-135, 0.5, 0));

const createFurniture = (location: Vector3d): IRoomObject => ({
    getLocation: () => location,
    model: { getValue: () => null }
} as unknown as IRoomObject);

// A seated unit reports the seat surface as its altitude and the seat height it
// was raised by as its vertical offset, exactly as RoomMessageHandler feeds them
// in from the unit status.
const createSitter = (location: Vector3d, seatHeight: number): IRoomObject => ({
    getLocation: () => location,
    model: {
        getValue: (key: string) => {
            if(key === RoomObjectVariable.FIGURE_POSTURE) return AvatarAction.POSTURE_SIT;
            if(key === RoomObjectVariable.FIGURE_VERTICAL_OFFSET) return seatHeight;

            return null;
        }
    }
} as unknown as IRoomObject);

// Sort depth exactly as RoomSpriteCanvas.renderObject computes it (minus the
// negligible screen-x and sprite-count tiebreakers). Smaller = drawn later =
// on top.
const sortDepth = (geometry: RoomGeometry, object: IRoomObject, relativeDepth: number) => {
    const screen = geometry.getScreenPosition(object.getLocation());

    expect(screen).not.toBeNull();

    return (screen.z - getObjectAltitudeDepth(object)) + relativeDepth;
};

const layerDepth = (geometry: RoomGeometry, sizeData: SizeData, layerId: number, floorHeight: number) =>
    sortDepth(geometry, createFurniture(new Vector3d(8, 5, floorHeight)), ((sizeData.getLayerZOffset(0, layerId) - (layerId * 0.001)) * DEPTH_MULTIPLIER));

// The sitter sits on the second tile of a sofa standing on `floorHeight`, so it
// is raised to the seat surface.
const seatedOrder = (floorHeight: number) => {
    const geometry = createGeometry();
    const sizeData = createSofaSizeData();
    const sitter = sortDepth(geometry, createSitter(new Vector3d(9, 5, (floorHeight + SEAT_HEIGHT)), SEAT_HEIGHT), AVATAR_SPRITE_DEFAULT_DEPTH);

    return {
        sitter,
        layer: (layerId: number) => layerDepth(geometry, sizeData, layerId, floorHeight)
    };
};

describe('seated avatar depth sorting', () => {
    it('keeps a sitter behind the seat front and over the seat back', () => {
        const { sitter, layer } = seatedOrder(0);

        expect(layer(3)).toBeLessThan(sitter);
        expect(sitter).toBeLessThan(layer(2));
        expect(sitter).toBeLessThan(layer(1));
        expect(sitter).toBeLessThan(layer(0));
    });

    it('keeps that order when the seat stands on a raised floor', () => {
        // a step under the sofa raises the seat and the sitter by the same
        // amount, so it must not reorder one against the other
        const { sitter, layer } = seatedOrder(1);

        expect(layer(3)).toBeLessThan(sitter);
        expect(sitter).toBeLessThan(layer(2));
        expect(sitter).toBeLessThan(layer(1));
        expect(sitter).toBeLessThan(layer(0));
    });

    it('documents that weighting the seat height would paint the sitter over the whole seat', () => {
        const geometry = createGeometry();
        const sizeData = createSofaSizeData();

        // a standing unit at the seat surface is weighted by its full altitude
        const weightedSitter = sortDepth(geometry, createFurniture(new Vector3d(9, 5, SEAT_HEIGHT)), AVATAR_SPRITE_DEFAULT_DEPTH);

        // 0.2 per seat height dwarfs the 0.006 that separates the sitter from
        // the front arm, so every layer of the sofa ends up behind the avatar
        expect(weightedSitter).toBeLessThan(layerDepth(geometry, sizeData, 3, 0));
    });

    it('documents that dropping the floor weight would paint the whole seat over the sitter', () => {
        const geometry = createGeometry();
        const sizeData = createSofaSizeData();
        const screen = geometry.getScreenPosition(new Vector3d(9, 5, 2));

        // weighting nothing at all leaves the sofa pushed 0.2 forward by the
        // step the sitter is then not pushed forward by, so the seat back -
        // which has to stay behind the sitter - paints over it instead
        const unweightedSitter = (screen.z + AVATAR_SPRITE_DEFAULT_DEPTH);

        expect(layerDepth(geometry, sizeData, 2, 1)).toBeLessThan(unweightedSitter);
    });
});
