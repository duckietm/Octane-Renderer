import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class ActivePrefixUpdatedParser implements IMessageParser
{
    private _prefixId: number;
    private _text: string;
    private _color: string;
    private _icon: string;
    private _effect: string;
    private _font: string;

    public flush(): boolean
    {
        this._prefixId = 0;
        this._text = '';
        this._color = '';
        this._icon = '';
        this._effect = '';
        this._font = '';
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._prefixId = wrapper.readInt();
        this._text = wrapper.readString();
        this._color = wrapper.readString();
        this._icon = wrapper.readString();
        this._effect = wrapper.readString();
        this._font = wrapper.readString();

        return true;
    }

    public get prefixId(): number
    {
        return this._prefixId;
    }
    public get text(): string
    {
        return this._text;
    }
    public get color(): string
    {
        return this._color;
    }
    public get icon(): string
    {
        return this._icon;
    }
    public get effect(): string
    {
        return this._effect;
    }
    public get font(): string
    {
        return this._font;
    }
}
