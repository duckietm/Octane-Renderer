import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { FurniItemData } from './FurniItemData';

export class FurniEditorSearchResultMessageParser implements IMessageParser
{
    private _items: FurniItemData[];
    private _total: number;
    private _page: number;

    public flush(): boolean
    {
        this._items = [];
        this._total = 0;
        this._page = 1;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const count = wrapper.readInt();

        this._items = [];

        for(let i = 0; i < count; i++)
        {
            const item = new FurniItemData();
            item.parse(wrapper);
            this._items.push(item);
        }

        this._total = wrapper.readInt();
        this._page = wrapper.readInt();

        return true;
    }

    public get items(): FurniItemData[]
    {
        return this._items;
    }

    public get total(): number
    {
        return this._total;
    }

    public get page(): number
    {
        return this._page;
    }
}
