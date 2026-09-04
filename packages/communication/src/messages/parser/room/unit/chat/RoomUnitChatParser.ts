import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';

export class RoomUnitChatParser implements IMessageParser
{
    private _roomIndex: number;
    private _message: string;
    private _gesture: number;
    private _bubble: number;
    private _urls: string[];
    private _chatColours: string;
    private _messageLength: number;
    private _prefixText: string;
    private _prefixColor: string;
    private _prefixIcon: string;
    private _prefixEffect: string;
    private _prefixFont: string;
    private _nickIcon: string;
    private _displayOrder: string;

    public flush(): boolean
    {
        this._roomIndex = null;
        this._message = null;
        this._gesture = 0;
        this._bubble = 0;
        this._urls = [];
        this._chatColours = null;
        this._messageLength = 0;
        this._prefixText = '';
        this._prefixColor = '';
        this._prefixIcon = '';
        this._prefixEffect = '';
        this._prefixFont = '';
        this._nickIcon = '';
        this._displayOrder = 'icon-prefix-name';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomIndex = wrapper.readInt();
        this._message = wrapper.readString();
        this._gesture = wrapper.readInt();
        this._bubble = wrapper.readInt();

        this.parseUrls(wrapper);

        this._chatColours = wrapper.readString();
        this._messageLength = wrapper.readInt();
        this._prefixText = wrapper.readString();
        this._prefixColor = wrapper.readString();
        this._prefixIcon = wrapper.readString();
        this._prefixEffect = wrapper.readString();
        this._prefixFont = wrapper.readString();
        this._nickIcon = wrapper.readString();
        this._displayOrder = (wrapper.bytesAvailable ? wrapper.readString() : 'icon-prefix-name');

        return true;
    }

    private parseUrls(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._urls = [];

        let totalUrls = wrapper.readInt();

        while(totalUrls > 0)
        {
            this._urls.push(wrapper.readString());

            totalUrls--;
        }

        return true;
    }

    public get roomIndex(): number
    {
        return this._roomIndex;
    }

    public get message(): string
    {
        return this._message;
    }

    public get gesture(): number
    {
        return this._gesture;
    }

    public get bubble(): number
    {
        return this._bubble;
    }

    public get urls(): string[]
    {
        return this._urls;
    }

    public get chatColours(): string
    {
        return this._chatColours;
    }

    public get messageLength(): number
    {
        return this._messageLength;
    }

    public get prefixText(): string
    {
        return this._prefixText;
    }

    public get prefixColor(): string
    {
        return this._prefixColor;
    }

    public get prefixIcon(): string
    {
        return this._prefixIcon;
    }

    public get prefixEffect(): string
    {
        return this._prefixEffect;
    }

    public get prefixFont(): string
    {
        return this._prefixFont;
    }

    public get nickIcon(): string
    {
        return this._nickIcon;
    }

    public get displayOrder(): string
    {
        return this._displayOrder;
    }
}
