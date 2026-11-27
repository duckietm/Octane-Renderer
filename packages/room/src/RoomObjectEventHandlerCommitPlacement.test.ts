import { RoomObjectCategory, RoomObjectOperationType } from '@octane/api';
import { describe, expect, it, vi } from 'vitest';
import { RoomObjectEventHandler } from './RoomObjectEventHandler';

vi.mock('./GetRoomEngine', () => ({
    GetRoomEngine: () => null
}));

const createHandler = (selectedData: Record<string, unknown>, previewInRoom: boolean = true) =>
{
    const handler = Object.create(RoomObjectEventHandler.prototype) as RoomObjectEventHandler;
    const placeObject = vi.fn();
    const modifyRoomObject = vi.fn(() => true);

    Object.assign(handler, {
        _roomEngine: { getRoomObject: () => (previewInRoom ? {} : null) },
        getSelectedRoomObjectData: () => selectedData,
        placeObject,
        modifyRoomObject
    });

    return { handler, placeObject, modifyRoomObject };
};

const placing = (category: number) => ({ id: -7, category, operation: RoomObjectOperationType.OBJECT_PLACE });

// A touch client has no pointer resting on the preview, so it drops the item through this call, not a click.
describe('RoomObjectEventHandler commitActiveObjectPlacement', () =>
{
    it('places a floor item where its preview stands, as a tile placement', () =>
    {
        const { handler, placeObject } = createHandler(placing(RoomObjectCategory.FLOOR));

        expect(handler.commitActiveObjectPlacement(1)).toBe(true);
        expect(placeObject).toHaveBeenCalledWith(1, true, false);
    });

    it('places a wall item as a wall placement', () =>
    {
        const { handler, placeObject } = createHandler(placing(RoomObjectCategory.WALL));

        expect(handler.commitActiveObjectPlacement(1)).toBe(true);
        expect(placeObject).toHaveBeenCalledWith(1, false, true);
    });

    it('drops an item that is being moved at its preview', () =>
    {
        const { handler, modifyRoomObject } = createHandler({ id: 5, category: RoomObjectCategory.FLOOR, operation: RoomObjectOperationType.OBJECT_MOVE });

        expect(handler.commitActiveObjectPlacement(1)).toBe(true);
        expect(modifyRoomObject).toHaveBeenCalledWith(1, 5, RoomObjectCategory.FLOOR, RoomObjectOperationType.OBJECT_MOVE_TO);
    });

    it('does nothing, and keeps the placement, while the preview is not on a valid spot or nothing is placed', () =>
    {
        const invalid = createHandler(placing(RoomObjectCategory.FLOOR), false);

        expect(invalid.handler.commitActiveObjectPlacement(1)).toBe(false);
        expect(invalid.placeObject).not.toHaveBeenCalled();
        expect(createHandler(null).handler.commitActiveObjectPlacement(1)).toBe(false);
    });
});
