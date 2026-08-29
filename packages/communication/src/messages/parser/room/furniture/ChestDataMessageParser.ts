import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';

export interface IChestCurrencyEntry
{
    currencyType: number;
    amount: number;
}

export interface IChestFurniEntry
{
    baseItemId: number;
    quantity: number;
}

export const CHEST_KIND_CURRENCY = 0;
export const CHEST_KIND_FURNI = 1;

/**
 * Player-facing wired chest (Scrigno) full state. Wire layout:
 * int itemId, string name, string description, int capacityMax, int used,
 * bool accessOpen, bool accessDonate, int appearanceState,
 * bool notifyFull, bool notifyDonation, bool notifyWithdraw, bool notifyEmpty, bool notifyWired, int notifyMode,
 * int entryCount, [int currencyType, int amount]*,
 * int chestKind, int furniCount, [int baseItemId, int quantity]*, bool locked, int capacity.
 */
export class ChestDataMessageParser implements IMessageParser
{
    private _itemId: number = 0;
    private _name: string = '';
    private _description: string = '';
    private _capacityMax: number = 0;
    private _used: number = 0;
    private _accessOpen: boolean = true;
    private _accessDonate: boolean = false;
    private _appearanceState: number = 0;
    private _notifyFull: boolean = false;
    private _notifyDonation: boolean = false;
    private _notifyWithdraw: boolean = false;
    private _notifyEmpty: boolean = false;
    private _notifyWired: boolean = false;
    private _notifyMode: number = 0;
    private _entries: IChestCurrencyEntry[] = [];
    private _chestKind: number = CHEST_KIND_CURRENCY;
    private _furniEntries: IChestFurniEntry[] = [];
    private _locked: boolean = false;
    private _capacity: number = 0;

    public flush(): boolean
    {
        this._itemId = 0;
        this._name = '';
        this._description = '';
        this._capacityMax = 0;
        this._used = 0;
        this._accessOpen = true;
        this._accessDonate = false;
        this._appearanceState = 0;
        this._notifyFull = false;
        this._notifyDonation = false;
        this._notifyWithdraw = false;
        this._notifyEmpty = false;
        this._notifyWired = false;
        this._notifyMode = 0;
        this._entries = [];
        this._chestKind = CHEST_KIND_CURRENCY;
        this._furniEntries = [];
        this._locked = false;
        this._capacity = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._itemId = wrapper.readInt();
        this._name = wrapper.readString();
        this._description = wrapper.readString();
        this._capacityMax = wrapper.readInt();
        this._used = wrapper.readInt();
        this._accessOpen = wrapper.readBoolean();
        this._accessDonate = wrapper.readBoolean();
        this._appearanceState = wrapper.readInt();
        this._notifyFull = wrapper.readBoolean();
        this._notifyDonation = wrapper.readBoolean();
        this._notifyWithdraw = wrapper.readBoolean();
        this._notifyEmpty = wrapper.readBoolean();
        this._notifyWired = wrapper.readBoolean();
        this._notifyMode = wrapper.readInt();

        const count = wrapper.readInt();
        this._entries = [];

        for(let i = 0; i < count; i++)
        {
            const currencyType = wrapper.readInt();
            const amount = wrapper.readInt();

            this._entries.push({ currencyType, amount });
        }

        // chestKind + furni contents + lock (appended; guard so an un-rebuilt server still parses)
        this._chestKind = CHEST_KIND_CURRENCY;
        this._furniEntries = [];
        this._locked = false;
        this._capacity = 0;

        if(!wrapper.bytesAvailable) return true;

        this._chestKind = wrapper.readInt();

        const furniCount = wrapper.readInt();

        for(let i = 0; i < furniCount; i++)
        {
            const baseItemId = wrapper.readInt();
            const quantity = wrapper.readInt();

            this._furniEntries.push({ baseItemId, quantity });
        }

        if(!wrapper.bytesAvailable) return true;

        this._locked = wrapper.readBoolean();

        if(!wrapper.bytesAvailable) return true;

        this._capacity = wrapper.readInt();

        return true;
    }

    public get itemId(): number { return this._itemId; }
    public get name(): string { return this._name; }
    public get description(): string { return this._description; }
    public get capacityMax(): number { return this._capacityMax; }
    public get used(): number { return this._used; }
    public get accessOpen(): boolean { return this._accessOpen; }
    public get accessDonate(): boolean { return this._accessDonate; }
    public get appearanceState(): number { return this._appearanceState; }
    public get notifyFull(): boolean { return this._notifyFull; }
    public get notifyDonation(): boolean { return this._notifyDonation; }
    public get notifyWithdraw(): boolean { return this._notifyWithdraw; }
    public get notifyEmpty(): boolean { return this._notifyEmpty; }
    public get notifyWired(): boolean { return this._notifyWired; }
    public get notifyMode(): number { return this._notifyMode; }
    public get entries(): IChestCurrencyEntry[] { return this._entries; }
    public get chestKind(): number { return this._chestKind; }
    public get furniEntries(): IChestFurniEntry[] { return this._furniEntries; }
    public get locked(): boolean { return this._locked; }
    /** The ceiling the owner set, at or below what they have bought. */
    public get capacity(): number { return this._capacity; }
}
