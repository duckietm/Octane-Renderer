import { RoomObjectCategory, RoomObjectOperationType } from '@octane/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomObjectEventHandler } from './RoomObjectEventHandler';
import { SelectedRoomObjectData } from './utils/SelectedRoomObjectData';

const send = vi.fn();

vi.mock('./GetRoomEngine', () => ({
    GetRoomEngine: () => null
}));

vi.mock('@octane/communication', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@octane/communication')>()),
    GetCommunication: () => ({ connection: { send } })
}));

vi.mock('@octane/session', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@octane/session')>()),
    GetRoomSessionManager: () => ({ getSession: () => null })
}));

const ROOM_ID = 3;

/**
 * A move is shown before the server answers. When nothing could be sent (a wall item with no legacy location, a pet
 * without user data) the server never put the object back, and it stayed at the preview position until a reload.
 */
const createHandler = (wallLocation: string | null) =>
{
    const location = { x: 6, y: 7, z: 0 };
    const direction = { x: 180, y: 0, z: 0 };
    const roomObject = {
        id: 8,
        model: { getValue: () => null, setValue: vi.fn() },
        getLocation: () => location,
        getDirection: () => direction,
        setLocation: vi.fn(),
        setDirection: vi.fn()
    };
    // Where the object was when the move started.
    const selected = new SelectedRoomObjectData(8, RoomObjectCategory.WALL, RoomObjectOperationType.OBJECT_MOVE, { x: 1, y: 2, z: 0 } as never, { x: 90, y: 0, z: 0 } as never);
    const handler = Object.create(RoomObjectEventHandler.prototype) as RoomObjectEventHandler;

    Object.assign(handler, {
        _roomEngine: {
            getRoomObject: () => roomObject,
            getSelectedRoomObjectData: () => selected,
            setSelectedRoomObjectData: vi.fn(),
            removeObjectMoverIconSprite: vi.fn(),
            getLegacyWallGeometry: () => ({ getOldLocationString: () => wallLocation })
        },
        resetSelectedObjectData: vi.fn()
    });

    return { handler, roomObject };
};

describe('RoomObjectEventHandler move to', () =>
{
    beforeEach(() => send.mockClear());

    it('puts back a wall item whose new place cannot be sent', () =>
    {
        const { handler, roomObject } = createHandler(null);

        handler.modifyRoomObject(ROOM_ID, 8, RoomObjectCategory.WALL, RoomObjectOperationType.OBJECT_MOVE_TO);

        expect(send).not.toHaveBeenCalled();
        expect(roomObject.setLocation).toHaveBeenCalledWith(expect.objectContaining({ x: 1, y: 2 }));
        expect(roomObject.setDirection).toHaveBeenCalledWith(expect.objectContaining({ x: 90 }));
    });

    it('leaves a sent move to the server', () =>
    {
        const { handler, roomObject } = createHandler(':w=1,2 l=3,4 r');

        handler.modifyRoomObject(ROOM_ID, 8, RoomObjectCategory.WALL, RoomObjectOperationType.OBJECT_MOVE_TO);

        expect(send).toHaveBeenCalledTimes(1);
        expect(roomObject.setLocation).not.toHaveBeenCalled();
    });
});
