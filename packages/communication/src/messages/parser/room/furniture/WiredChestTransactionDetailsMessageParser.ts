import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface IWiredChestTransactionDetailItem
{
    spriteId: number;
    quantity: number;
}

/**
 * One wired chest transaction with the furni it moved. Wire layout:
 * int transactionId, int chestId, int chestKind, int type, int source, int userId, string userName,
 * int currencyType, int withdrawn, int deposited, int timestamp,
 * int itemCount, [int spriteId, int quantity]*.
 *
 * The item list is empty for a currency transaction. spriteId is the furnidata class id, the same
 * identity ChestDataMessageParser carries.
 */
export class WiredChestTransactionDetailsMessageParser implements IMessageParser
{
    private _transactionId: number = 0;
    private _chestId: number = 0;
    private _chestKind: number = 0;
    private _type: number = 0;
    private _source: number = 0;
    private _userId: number = 0;
    private _userName: string = '';
    private _currencyType: number = -1;
    private _withdrawn: number = 0;
    private _deposited: number = 0;
    private _timestamp: number = 0;
    private _items: IWiredChestTransactionDetailItem[] = [];

    public flush(): boolean
    {
        this._transactionId = 0;
        this._chestId = 0;
        this._chestKind = 0;
        this._type = 0;
        this._source = 0;
        this._userId = 0;
        this._userName = '';
        this._currencyType = -1;
        this._withdrawn = 0;
        this._deposited = 0;
        this._timestamp = 0;
        this._items = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._transactionId = wrapper.readInt();
        this._chestId = wrapper.readInt();
        this._chestKind = wrapper.readInt();
        this._type = wrapper.readInt();
        this._source = wrapper.readInt();
        this._userId = wrapper.readInt();
        this._userName = wrapper.readString();
        this._currencyType = wrapper.readInt();
        this._withdrawn = wrapper.readInt();
        this._deposited = wrapper.readInt();
        this._timestamp = wrapper.readInt();

        const count = wrapper.readInt();
        this._items = [];

        for(let i = 0; i < count; i++)
        {
            const spriteId = wrapper.readInt();
            const quantity = wrapper.readInt();

            this._items.push({ spriteId, quantity });
        }

        return true;
    }

    public get transactionId(): number
    {
        return this._transactionId;
    }
    public get chestId(): number
    {
        return this._chestId;
    }
    public get chestKind(): number
    {
        return this._chestKind;
    }
    public get type(): number
    {
        return this._type;
    }
    public get source(): number
    {
        return this._source;
    }
    public get userId(): number
    {
        return this._userId;
    }
    public get userName(): string
    {
        return this._userName;
    }
    public get currencyType(): number
    {
        return this._currencyType;
    }
    public get withdrawn(): number
    {
        return this._withdrawn;
    }
    public get deposited(): number
    {
        return this._deposited;
    }
    public get timestamp(): number
    {
        return this._timestamp;
    }
    public get items(): IWiredChestTransactionDetailItem[]
    {
        return this._items;
    }
}
