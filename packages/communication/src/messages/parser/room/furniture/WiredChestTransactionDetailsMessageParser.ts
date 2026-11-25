import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { IWiredChestTransactionRow, readWiredChestTransaction } from './WiredChestRoomLogsMessageParser';

/** AIR's ChestItemType with how many of it moved. */
export interface IWiredChestTransactionDetailItem
{
    wallItem: boolean;
    typeId: number;
    posterId: string;
    quantity: number;
}

/**
 * One wired chest transaction with its chests and furni, as AIR's WiredTransactionDetails. Wire layout:
 * the transaction, int chestCount, [int chestId]*, int withdrawnCount, [bool wall, int typeId, string posterId,
 * int quantity]*, int depositedCount, [the same]*, bool incomplete.
 *
 * typeId is the furnidata class id, the same identity ChestDataMessageParser carries. incomplete says the lines
 * do not name all the furni the counts do.
 */
export class WiredChestTransactionDetailsMessageParser implements IMessageParser
{
    private _transaction: IWiredChestTransactionRow | null = null;
    private _chestIds: number[] = [];
    private _withdrawn: IWiredChestTransactionDetailItem[] = [];
    private _deposited: IWiredChestTransactionDetailItem[] = [];
    private _incomplete: boolean = false;

    public flush(): boolean
    {
        this._transaction = null;
        this._chestIds = [];
        this._withdrawn = [];
        this._deposited = [];
        this._incomplete = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._transaction = readWiredChestTransaction(wrapper);

        const chestCount = wrapper.readInt();
        this._chestIds = [];

        for(let i = 0; i < chestCount; i++) this._chestIds.push(wrapper.readInt());

        this._withdrawn = WiredChestTransactionDetailsMessageParser.readItems(wrapper);
        this._deposited = WiredChestTransactionDetailsMessageParser.readItems(wrapper);
        this._incomplete = wrapper.readBoolean();

        return true;
    }

    private static readItems(wrapper: IMessageDataWrapper): IWiredChestTransactionDetailItem[]
    {
        const count = wrapper.readInt();
        const items: IWiredChestTransactionDetailItem[] = [];

        for(let i = 0; i < count; i++)
        {
            const wallItem = wrapper.readBoolean();
            const typeId = wrapper.readInt();
            const posterId = wrapper.readString();
            const quantity = wrapper.readInt();

            items.push({ wallItem, typeId, posterId, quantity });
        }

        return items;
    }

    public get transaction(): IWiredChestTransactionRow | null
    {
        return this._transaction;
    }
    public get transactionId(): number
    {
        return this._transaction?.transactionId ?? 0;
    }
    public get chestIds(): number[]
    {
        return this._chestIds;
    }
    public get withdrawn(): IWiredChestTransactionDetailItem[]
    {
        return this._withdrawn;
    }
    public get deposited(): IWiredChestTransactionDetailItem[]
    {
        return this._deposited;
    }
    public get incomplete(): boolean
    {
        return this._incomplete;
    }
}
