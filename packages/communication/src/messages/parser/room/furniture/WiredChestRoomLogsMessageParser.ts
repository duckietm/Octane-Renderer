import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** AIR's transaction methods (`wired_transactions.type.N`). */
export const CHEST_TRANSACTION_METHOD_MANUAL = 0;
export const CHEST_TRANSACTION_METHOD_WIRED = 1;
export const CHEST_TRANSACTION_METHOD_CONTRACT_PAYMENT = 2;
export const CHEST_TRANSACTION_METHOD_CONTRACT_REWARD = 3;
export const CHEST_TRANSACTION_METHOD_CONTRACT_TRADE = 4;

/** AIR's list types (`wiredchests.logs.type.N`): one chest's log, or the room's. */
export const CHEST_LOG_LIST_CHEST = 0;
export const CHEST_LOG_LIST_ROOM = 1;

export const CHEST_LOG_FILTER_ALL = 0;
export const CHEST_LOG_FILTER_CURRENCY = 1;
export const CHEST_LOG_FILTER_FURNI = 2;

/** One transaction as AIR's WiredTransactionInfo: everything one action moved, over all the chests it touched. */
export interface IWiredChestTransactionRow
{
    transactionId: number;
    roomId: number;
    method: number;
    definitionInfo: string;
    userId: number;
    userName: string;
    timestamp: number;
    readableTimestamp: string;
    chestCount: number;
    withdrawnFurni: number;
    depositedFurni: number;
    withdrawnCoins: number;
    depositedCoins: number;
}

/**
 * Reads one transaction: int transactionId, int roomId, int method, string definitionInfo, int userId,
 * string userName, int timestamp, string readableTimestamp, int chestCount, int withdrawnFurni, int depositedFurni,
 * int withdrawnCoins, int depositedCoins.
 */
export const readWiredChestTransaction = (wrapper: IMessageDataWrapper): IWiredChestTransactionRow =>
{
    const transactionId = wrapper.readInt();
    const roomId = wrapper.readInt();
    const method = wrapper.readInt();
    const definitionInfo = wrapper.readString();
    const userId = wrapper.readInt();
    const userName = wrapper.readString();
    const timestamp = wrapper.readInt();
    const readableTimestamp = wrapper.readString();
    const chestCount = wrapper.readInt();
    const withdrawnFurni = wrapper.readInt();
    const depositedFurni = wrapper.readInt();
    const withdrawnCoins = wrapper.readInt();
    const depositedCoins = wrapper.readInt();

    return { transactionId, roomId, method, definitionInfo, userId, userName, timestamp, readableTimestamp, chestCount, withdrawnFurni, depositedFurni, withdrawnCoins, depositedCoins };
};

/**
 * One page of wired chest transactions, newest first, as AIR's transaction list. Wire layout:
 * int listType, int listId, int total, int page, int amount, int rowCount, [transaction]*.
 * listType 0 is one chest's log (listId the chest), 1 the room's (listId the room).
 */
export class WiredChestRoomLogsMessageParser implements IMessageParser
{
    private _listType: number = CHEST_LOG_LIST_ROOM;
    private _listId: number = 0;
    private _total: number = 0;
    private _page: number = 1;
    private _amount: number = 0;
    private _rows: IWiredChestTransactionRow[] = [];

    public flush(): boolean
    {
        this._listType = CHEST_LOG_LIST_ROOM;
        this._listId = 0;
        this._total = 0;
        this._page = 1;
        this._amount = 0;
        this._rows = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._listType = wrapper.readInt();
        this._listId = wrapper.readInt();
        this._total = wrapper.readInt();
        this._page = wrapper.readInt();
        this._amount = wrapper.readInt();

        const count = wrapper.readInt();
        this._rows = [];

        for(let i = 0; i < count; i++) this._rows.push(readWiredChestTransaction(wrapper));

        return true;
    }

    public get listType(): number
    {
        return this._listType;
    }
    public get listId(): number
    {
        return this._listId;
    }
    public get total(): number
    {
        return this._total;
    }
    public get page(): number
    {
        return this._page;
    }
    public get amount(): number
    {
        return this._amount;
    }
    public get rows(): IWiredChestTransactionRow[]
    {
        return this._rows;
    }
}
