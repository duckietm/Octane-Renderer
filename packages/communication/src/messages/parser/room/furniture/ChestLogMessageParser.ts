import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface IChestLogRow
{
    type: string;
    timestamp: number;
    userName: string;
    withdrawn: number;
    deposited: number;
}

/**
 * Wired chest (Scrigno) transaction log. Wire layout:
 * int itemId, int rowCount, [string type, int epochSeconds, string userName, int withdrawn, int deposited]*.
 */
export class ChestLogMessageParser implements IMessageParser
{
    private _itemId: number = 0;
    private _rows: IChestLogRow[] = [];

    public flush(): boolean
    {
        this._itemId = 0;
        this._rows = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._itemId = wrapper.readInt();

        const count = wrapper.readInt();
        this._rows = [];

        for(let i = 0; i < count; i++)
        {
            const type = wrapper.readString();
            const timestamp = wrapper.readInt();
            const userName = wrapper.readString();
            const withdrawn = wrapper.readInt();
            const deposited = wrapper.readInt();

            this._rows.push({ type, timestamp, userName, withdrawn, deposited });
        }

        return true;
    }

    public get itemId(): number
    {
        return this._itemId;
    }
    public get rows(): IChestLogRow[]
    {
        return this._rows;
    }
}
