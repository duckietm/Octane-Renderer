import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export const CHEST_TRANSACTION_DEPOSIT = 0;
export const CHEST_TRANSACTION_WITHDRAW = 1;

export const CHEST_TRANSACTION_SOURCE_USER = 0;
export const CHEST_TRANSACTION_SOURCE_WIRED = 1;

export const CHEST_LOG_FILTER_ALL = 0;
export const CHEST_LOG_FILTER_CURRENCY = 1;
export const CHEST_LOG_FILTER_FURNI = 2;

export interface IWiredChestTransactionRow
{
    transactionId: number;
    chestId: number;
    chestKind: number;
    type: number;
    source: number;
    userId: number;
    userName: string;
    currencyType: number;
    withdrawn: number;
    deposited: number;
    hasDetails: boolean;
    timestamp: number;
}

/**
 * One page of the room-wide wired chest transaction log, newest first. Wire layout:
 * int page, int pageCount, int totalRows, int filter, int rowCount,
 * [int transactionId, int chestId, int chestKind, int type, int source, int userId, string userName,
 *  int currencyType, int withdrawn, int deposited, bool hasDetails, int timestamp]*.
 */
export class WiredChestRoomLogsMessageParser implements IMessageParser
{
    private _page: number = 1;
    private _pageCount: number = 1;
    private _totalRows: number = 0;
    private _filter: number = CHEST_LOG_FILTER_ALL;
    private _rows: IWiredChestTransactionRow[] = [];

    public flush(): boolean
    {
        this._page = 1;
        this._pageCount = 1;
        this._totalRows = 0;
        this._filter = CHEST_LOG_FILTER_ALL;
        this._rows = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._page = wrapper.readInt();
        this._pageCount = wrapper.readInt();
        this._totalRows = wrapper.readInt();
        this._filter = wrapper.readInt();

        const count = wrapper.readInt();
        this._rows = [];

        for(let i = 0; i < count; i++)
        {
            const transactionId = wrapper.readInt();
            const chestId = wrapper.readInt();
            const chestKind = wrapper.readInt();
            const type = wrapper.readInt();
            const source = wrapper.readInt();
            const userId = wrapper.readInt();
            const userName = wrapper.readString();
            const currencyType = wrapper.readInt();
            const withdrawn = wrapper.readInt();
            const deposited = wrapper.readInt();
            const hasDetails = wrapper.readBoolean();
            const timestamp = wrapper.readInt();

            this._rows.push({ transactionId, chestId, chestKind, type, source, userId, userName, currencyType, withdrawn, deposited, hasDetails, timestamp });
        }

        return true;
    }

    public get page(): number
    {
        return this._page;
    }
    public get pageCount(): number
    {
        return this._pageCount;
    }
    public get totalRows(): number
    {
        return this._totalRows;
    }
    public get filter(): number
    {
        return this._filter;
    }
    public get rows(): IWiredChestTransactionRow[]
    {
        return this._rows;
    }
}
