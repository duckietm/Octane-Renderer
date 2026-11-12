import { RoomObjectCategory, RoomObjectOperationType, RoomObjectUserType } from '@octane/api';
import { describe, expect, it, vi } from 'vitest';
import { RoomObjectEventHandler } from './RoomObjectEventHandler';

vi.mock('./GetRoomEngine', () => ({
    GetRoomEngine: () => null
}));

vi.mock('@octane/communication', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@octane/communication')>()),
    GetCommunication: () => ({ connection: { send: vi.fn() } })
}));

const shiftClick = (objectType: string) =>
{
    const modifyRoomObject = vi.fn(() => true);
    const handler = Object.create(RoomObjectEventHandler.prototype) as RoomObjectEventHandler;

    Object.assign(handler, {
        _roomEngine: {
            getRoomObjectCategoryForType: () => RoomObjectCategory.UNIT,
            isAreaSelectionMode: () => false,
            isPlayingGame: () => false,
            isDecorating: false,
            moveBlocked: false,
            wiredClickUserOption: 0,
            wiredClickFurniOption: 0,
            getRoomObject: (): null => null,
            getRoomObjectSelectionArrow: (): null => null,
            setSelectedAvatar: vi.fn()
        },
        _eventIds: new Map(),
        _selectedAvatarId: -1,
        modifyRoomObject,
        getSelectedRoomObjectData: (): null => null,
        setSelectedObject: vi.fn(),
        whereYouClickIsWhereYouGo: () => false,
        clickRoomObject: vi.fn()
    });

    (handler as unknown as { handleRoomObjectMouseClickEvent: (event: unknown, roomId: number) => void }).handleRoomObjectMouseClickEvent(
        { objectId: 7, objectType, eventId: '', altKey: false, ctrlKey: false, shiftKey: true }, 1);

    return modifyRoomObject;
};

describe('RoomObjectEventHandler shift-click', () =>
{
    it.each([ RoomObjectUserType.RENTABLE_BOT, RoomObjectUserType.MONSTER_PLANT ])('turns a %s', (type) =>
    {
        expect(shiftClick(type)).toHaveBeenCalledWith(1, 7, RoomObjectCategory.UNIT, RoomObjectOperationType.OBJECT_ROTATE_POSITIVE);
    });

    it('does not turn another user', () =>
    {
        expect(shiftClick(RoomObjectUserType.USER)).not.toHaveBeenCalled();
    });

    it('lets a unit without a furniture size turn on a free tile', () =>
    {
        const handler = Object.create(RoomObjectEventHandler.prototype) as unknown as { isValidLocation: (object: unknown, direction: unknown, map: unknown) => boolean };
        const sizes: number[][] = [];
        const bot = {
            model: { getValue: (): undefined => undefined },
            getDirection: () => ({ x: 90 }),
            getLocation: () => ({ x: 4, y: 5, z: 0 })
        };
        const map = {
            validateLocation: (_x: number, _y: number, sizeX: number, sizeY: number) =>
            {
                sizes.push([ sizeX, sizeY ]);

                return true;
            }
        };

        expect(handler.isValidLocation(bot, { x: 135 }, map)).toBe(true);
        expect(sizes).toEqual([ [ 1, 1 ] ]);
    });
});
