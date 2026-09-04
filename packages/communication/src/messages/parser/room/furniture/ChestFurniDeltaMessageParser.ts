import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';
import { ChestFurniStoredItemParser, IChestFurniStoredItem } from './ChestFurniStoredItemParser';

/** Furni-chest incremental update (official Sola wire shape, header 9323). */
export class ChestFurniDeltaMessageParser implements IMessageParser
{
    private _chestId: number = 0;
    private _removedIds: number[] = [];
    private _added: IChestFurniStoredItem[] = [];

    public flush(): boolean
    {
        this._chestId = 0;
        this._removedIds = [];
        this._added = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._chestId = wrapper.readInt();

        const removedCount = wrapper.readInt();
        this._removedIds = [];

        for(let i = 0; i < removedCount; i++)
        {
            this._removedIds.push(wrapper.readInt());
        }

        const addedCount = wrapper.readInt();
        this._added = [];

        for(let i = 0; i < addedCount; i++)
        {
            this._added.push(ChestFurniStoredItemParser.parse(wrapper));
        }

        return true;
    }

    public get chestId(): number
    {
        return this._chestId;
    }
    public get removedIds(): number[]
    {
        return this._removedIds;
    }
    public get added(): IChestFurniStoredItem[]
    {
        return this._added;
    }
}
