import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class WiredFurniMoveStyleParser implements IMessageParser
{
    public static readonly STYLE_LINEAR = 0;
    public static readonly STYLE_MAX = 6;
    public static readonly MAXIMUM_ITEMS = 1000;
    private static readonly HEADER_BYTES = 4;
    private static readonly ITEM_BYTES = 4;
    private static readonly TRAILER_BYTES = 8;

    private _itemIds: number[] = [];
    private _style = 0;
    private _intensity = 0;

    public flush(): boolean
    {
        this._itemIds = [];
        this._style = 0;
        this._intensity = 0;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();
        if(!wrapper || !this.hasBytes(wrapper, WiredFurniMoveStyleParser.HEADER_BYTES)) return false;

        const count = wrapper.readInt();

        if((count < 0) || (count > WiredFurniMoveStyleParser.MAXIMUM_ITEMS)) return false;
        if(!this.hasBytes(wrapper, (count * WiredFurniMoveStyleParser.ITEM_BYTES) + WiredFurniMoveStyleParser.TRAILER_BYTES)) return false;

        const itemIds: number[] = [];

        for(let index = 0; index < count; index++)
        {
            const itemId = wrapper.readInt();

            if(itemId <= 0) return false;

            itemIds.push(itemId);
        }

        this._itemIds = itemIds;
        this._style = Math.max(WiredFurniMoveStyleParser.STYLE_LINEAR, Math.min(WiredFurniMoveStyleParser.STYLE_MAX, wrapper.readInt()));
        this._intensity = Math.max(0, Math.min(100, wrapper.readInt()));
        return true;
    }

    private hasBytes(wrapper: IMessageDataWrapper, required: number): boolean
    {
        if(required <= 0) return true;
        if(typeof wrapper.remainingBytes === 'number') return wrapper.remainingBytes >= required;
        return wrapper.bytesAvailable;
    }

    public get itemIds(): readonly number[]
    {
        return this._itemIds;
    }

    public get style(): number
    {
        return this._style;
    }

    public get intensity(): number
    {
        return this._intensity;
    }
}
