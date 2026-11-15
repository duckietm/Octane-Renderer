import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * A page of a bot dialogue, for the bot's menu: the bot's web id, the page's code, what the bot says and the labels
 * of the options. A code of 0 means the dialogue closed. At most {@link BotDialogueParser.MAX_OPTIONS} options are
 * read, so a broken count cannot make the client loop.
 */
export class BotDialogueParser implements IMessageParser
{
    public static readonly MAX_OPTIONS = 6;

    private _botId = 0;
    private _nonce = 0;
    private _text = '';
    private _options: string[] = [];

    public flush(): boolean
    {
        this._botId = 0;
        this._nonce = 0;
        this._text = '';
        this._options = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._botId = wrapper.readInt();
        this._nonce = wrapper.readInt();
        this._text = wrapper.readString();

        const count = wrapper.readInt();

        if(count < 0 || count > BotDialogueParser.MAX_OPTIONS) return false;

        this._options = [];

        for(let i = 0; i < count; i++) this._options.push(wrapper.readString());

        return true;
    }

    public get botId(): number
    {
        return this._botId;
    }

    public get nonce(): number
    {
        return this._nonce;
    }

    public get text(): string
    {
        return this._text;
    }

    public get options(): string[]
    {
        return this._options;
    }

    /** True when the server closed the dialogue. */
    public get closed(): boolean
    {
        return this._nonce === 0;
    }
}
