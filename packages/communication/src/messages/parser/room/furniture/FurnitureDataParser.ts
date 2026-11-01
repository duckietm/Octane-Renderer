import { IMessageDataWrapper, IMessageParser, IObjectData, ObjectDataFactory } from '@octane/api';

export class FurnitureDataParser implements IMessageParser
{
    private _itemId: number;
    private _data: IObjectData;

    public flush(): boolean
    {
        this._itemId = 0;
        this._data = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._itemId = parseInt(wrapper.readString());
        this._data = FurnitureDataParser.parseObjectData(wrapper);

        return true;
    }

    public static parseObjectData(wrapper: IMessageDataWrapper): IObjectData
    {
        if(!wrapper) return null;

        const format = wrapper.readInt();
        const data = ObjectDataFactory.getData(format);

        // An unknown format cannot be skipped, since only the format knows its length: reading on would take its
        // payload for the next furni's fields. The packet is dropped instead.
        if(!data) throw new Error(`Unknown stuff data format ${ format }`);

        data.parseWrapper(wrapper);

        return data;
    }

    public get furnitureId(): number
    {
        return this._itemId;
    }

    public get objectData(): IObjectData
    {
        return this._data;
    }
}
