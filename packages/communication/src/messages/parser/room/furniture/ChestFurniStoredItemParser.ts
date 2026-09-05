import { IMessageDataWrapper, IObjectData } from '@octane/api';
import { FurnitureDataParser } from './FurnitureDataParser';

export interface IChestFurniStoredItem
{
    inventoryId: number;
    lockState: number;
    transactionId: number;
    wallItem: boolean;
    baseItemId: number;
    legacyPosterId: string;
    groupable: boolean;
    specialType: number;
    stuffData: IObjectData;
    extra: number;
}

export class ChestFurniStoredItemParser
{
    public static parse(wrapper: IMessageDataWrapper): IChestFurniStoredItem
    {
        const inventoryId = wrapper.readInt();
        const lockState = wrapper.readInt();
        const transactionId = ChestFurniStoredItemParser.readLong(wrapper);
        const wallItem = wrapper.readBoolean();
        const baseItemId = wrapper.readInt();
        const legacyPosterId = wrapper.readString();
        const groupable = wrapper.readBoolean();
        const specialType = wrapper.readInt();
        const stuffData = FurnitureDataParser.parseObjectData(wrapper);
        const extra = wallItem ? 0 : wrapper.readInt();

        return {
            inventoryId,
            lockState,
            transactionId,
            wallItem,
            baseItemId,
            legacyPosterId,
            groupable,
            specialType,
            stuffData,
            extra
        };
    }

    private static readLong(wrapper: IMessageDataWrapper): number
    {
        const high = wrapper.readInt() >>> 0;
        const low = wrapper.readInt() >>> 0;

        return (high * 0x100000000) + low;
    }
}
