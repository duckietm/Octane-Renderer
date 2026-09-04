import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';
import { IWiredTradeNode, readWiredTradeNode } from './WiredTradeRuleParser';

export const WIRED_TRADE_STATE_READY = 0;
export const WIRED_TRADE_STATE_ADDING_ITEMS = 1;
export const WIRED_TRADE_STATE_COUNTDOWN = 2;
export const WIRED_TRADE_STATE_CONFIRMING = 3;
export const WIRED_TRADE_STATE_CONFIRMED = 4;

/** One item the player has put on the table. */
export interface IWiredTradeOfferedItem
{
    itemId: number;
    wallItem: boolean;
    spriteId: number;
}

export interface IWiredTradeRewardFurni
{
    spriteId: number;
    amount: number;
}

export interface IWiredTradeRewardCurrency
{
    currencyType: number;
    amount: number;
}

/**
 * The state of the table, pushed after every change. Wire layout:
 * int state, bool canAccept, int secondsLeft,
 * int offeredCount, [int itemId, bool wallItem, int spriteId]*,
 * int rewardFurniCount, [int spriteId, int amount]*,
 * int rewardCurrencyCount, [int currencyType, int amount]*,
 * int missingCount, [node]*.
 *
 * The reward arrives split because the window draws the halves differently: a pile of coins is not
 * an inventory icon. An empty `missing` is what lights the accept button.
 */
export class WiredTradeItemsMessageParser implements IMessageParser
{
    private _state: number = WIRED_TRADE_STATE_READY;
    private _canAccept: boolean = false;
    private _secondsLeft: number = 0;
    private _offeredItems: IWiredTradeOfferedItem[] = [];
    private _rewardFurni: IWiredTradeRewardFurni[] = [];
    private _rewardCurrency: IWiredTradeRewardCurrency[] = [];
    private _missing: IWiredTradeNode[] = [];

    public flush(): boolean
    {
        this._state = WIRED_TRADE_STATE_READY;
        this._canAccept = false;
        this._secondsLeft = 0;
        this._offeredItems = [];
        this._rewardFurni = [];
        this._rewardCurrency = [];
        this._missing = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._state = wrapper.readInt();
        this._canAccept = wrapper.readBoolean();
        this._secondsLeft = wrapper.readInt();

        this._offeredItems = [];

        const offeredCount = wrapper.readInt();

        for(let i = 0; i < offeredCount; i++)
        {
            const itemId = wrapper.readInt();
            const wallItem = wrapper.readBoolean();
            const spriteId = wrapper.readInt();

            this._offeredItems.push({ itemId, wallItem, spriteId });
        }

        this._rewardFurni = [];

        const rewardFurniCount = wrapper.readInt();

        for(let i = 0; i < rewardFurniCount; i++)
        {
            const spriteId = wrapper.readInt();
            const amount = wrapper.readInt();

            this._rewardFurni.push({ spriteId, amount });
        }

        this._rewardCurrency = [];

        const rewardCurrencyCount = wrapper.readInt();

        for(let i = 0; i < rewardCurrencyCount; i++)
        {
            const currencyType = wrapper.readInt();
            const amount = wrapper.readInt();

            this._rewardCurrency.push({ currencyType, amount });
        }

        this._missing = [];

        const missingCount = wrapper.readInt();

        for(let i = 0; i < missingCount; i++) this._missing.push(readWiredTradeNode(wrapper));

        return true;
    }

    public get state(): number
    {
        return this._state;
    }
    public get canAccept(): boolean
    {
        return this._canAccept;
    }
    public get secondsLeft(): number
    {
        return this._secondsLeft;
    }
    public get offeredItems(): IWiredTradeOfferedItem[]
    {
        return this._offeredItems;
    }
    public get rewardFurni(): IWiredTradeRewardFurni[]
    {
        return this._rewardFurni;
    }
    public get rewardCurrency(): IWiredTradeRewardCurrency[]
    {
        return this._rewardCurrency;
    }
    public get missing(): IWiredTradeNode[]
    {
        return this._missing;
    }
}
