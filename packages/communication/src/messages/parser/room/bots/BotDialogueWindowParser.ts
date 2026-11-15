import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** An item of a bot dialogue window: label, furni icon class name, price (0 hides it), detail, tab (-1 for all) and most at once. */
export interface IBotDialogueWindowItem
{
    label: string;
    icon: string;
    price: number;
    detail: string;
    tab: number;
    maxAmount: number;
}

/**
 * A bot dialogue in a window of its own: the bot's web id, the window's code, the title, what the bot says, the action
 * button's label, the tabs, the items and the footer lines. A code of 0 means the window closed. Counts above the
 * server's limits are refused, so a broken count cannot make the client loop.
 */
export class BotDialogueWindowParser implements IMessageParser
{
    public static readonly MAX_TABS = 4;
    public static readonly MAX_ITEMS = 24;
    public static readonly MAX_FOOTER = 3;

    private _botId = 0;
    private _nonce = 0;
    private _title = '';
    private _text = '';
    private _action = '';
    private _tabs: string[] = [];
    private _items: IBotDialogueWindowItem[] = [];
    private _footer: string[] = [];

    public flush(): boolean
    {
        this._botId = 0;
        this._nonce = 0;
        this._title = '';
        this._text = '';
        this._action = '';
        this._tabs = [];
        this._items = [];
        this._footer = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._botId = wrapper.readInt();
        this._nonce = wrapper.readInt();
        this._title = wrapper.readString();
        this._text = wrapper.readString();
        this._action = wrapper.readString();

        const tabs = this.readStrings(wrapper, BotDialogueWindowParser.MAX_TABS);

        if(!tabs) return false;

        this._tabs = tabs;

        const count = wrapper.readInt();

        if(count < 0 || count > BotDialogueWindowParser.MAX_ITEMS) return false;

        this._items = [];

        for(let i = 0; i < count; i++)
        {
            this._items.push({
                label: wrapper.readString(),
                icon: wrapper.readString(),
                price: wrapper.readInt(),
                detail: wrapper.readString(),
                tab: wrapper.readInt(),
                maxAmount: wrapper.readInt()
            });
        }

        const footer = this.readStrings(wrapper, BotDialogueWindowParser.MAX_FOOTER);

        if(!footer) return false;

        this._footer = footer;

        return true;
    }

    private readStrings(wrapper: IMessageDataWrapper, max: number): string[]
    {
        const count = wrapper.readInt();

        if(count < 0 || count > max) return null;

        const values: string[] = [];

        for(let i = 0; i < count; i++) values.push(wrapper.readString());

        return values;
    }

    public get botId(): number
    {
        return this._botId;
    }

    public get nonce(): number
    {
        return this._nonce;
    }

    public get title(): string
    {
        return this._title;
    }

    public get text(): string
    {
        return this._text;
    }

    public get action(): string
    {
        return this._action;
    }

    public get tabs(): string[]
    {
        return this._tabs;
    }

    public get items(): IBotDialogueWindowItem[]
    {
        return this._items;
    }

    public get footer(): string[]
    {
        return this._footer;
    }

    /** True when the server closed the window. */
    public get closed(): boolean
    {
        return this._nonce === 0;
    }
}
