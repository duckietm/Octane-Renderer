import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';

export class CatalogAdminPageDetailsMessageParser implements IMessageParser
{
    private _pageId: number;
    private _caption: string;
    private _captionSave: string;
    private _parentId: number;
    private _catalogMode: string;
    private _layout: string;
    private _iconColor: number;
    private _iconImage: number;
    private _minRank: number;
    private _orderNum: number;
    private _visible: boolean;
    private _enabled: boolean;
    private _clubOnly: boolean;
    private _vipOnly: boolean;
    private _headline: string;
    private _teaser: string;
    private _special: string;
    private _textOne: string;
    private _textTwo: string;
    private _textDetails: string;
    private _textTeaser: string;
    private _roomId: number;
    private _includes: string;

    public flush(): boolean
    {
        this._pageId = -1;
        this._caption = '';
        this._captionSave = '';
        this._parentId = -1;
        this._catalogMode = 'NORMAL';
        this._layout = 'default_3x3';
        this._iconColor = 1;
        this._iconImage = 0;
        this._minRank = 1;
        this._orderNum = 0;
        this._visible = true;
        this._enabled = true;
        this._clubOnly = false;
        this._vipOnly = false;
        this._headline = '';
        this._teaser = '';
        this._special = '';
        this._textOne = '';
        this._textTwo = '';
        this._textDetails = '';
        this._textTeaser = '';
        this._roomId = 0;
        this._includes = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._pageId = wrapper.readInt();
        this._caption = wrapper.readString();
        this._captionSave = wrapper.readString();
        this._parentId = wrapper.readInt();
        this._catalogMode = wrapper.readString();
        this._layout = wrapper.readString();
        this._iconColor = wrapper.readInt();
        this._iconImage = wrapper.readInt();
        this._minRank = wrapper.readInt();
        this._orderNum = wrapper.readInt();
        this._visible = wrapper.readBoolean();
        this._enabled = wrapper.readBoolean();
        this._clubOnly = wrapper.readBoolean();
        this._vipOnly = wrapper.readBoolean();
        this._headline = wrapper.readString();
        this._teaser = wrapper.readString();
        this._special = wrapper.readString();
        this._textOne = wrapper.readString();
        this._textTwo = wrapper.readString();
        this._textDetails = wrapper.readString();
        this._textTeaser = wrapper.readString();
        this._roomId = wrapper.readInt();
        this._includes = wrapper.readString();

        return true;
    }

    public get pageId(): number
    {
        return this._pageId;
    }
    public get caption(): string
    {
        return this._caption;
    }
    public get captionSave(): string
    {
        return this._captionSave;
    }
    public get parentId(): number
    {
        return this._parentId;
    }
    public get catalogMode(): string
    {
        return this._catalogMode;
    }
    public get layout(): string
    {
        return this._layout;
    }
    public get iconColor(): number
    {
        return this._iconColor;
    }
    public get iconImage(): number
    {
        return this._iconImage;
    }
    public get minRank(): number
    {
        return this._minRank;
    }
    public get orderNum(): number
    {
        return this._orderNum;
    }
    public get visible(): boolean
    {
        return this._visible;
    }
    public get enabled(): boolean
    {
        return this._enabled;
    }
    public get clubOnly(): boolean
    {
        return this._clubOnly;
    }
    public get vipOnly(): boolean
    {
        return this._vipOnly;
    }
    public get headline(): string
    {
        return this._headline;
    }
    public get teaser(): string
    {
        return this._teaser;
    }
    public get special(): string
    {
        return this._special;
    }
    public get textOne(): string
    {
        return this._textOne;
    }
    public get textTwo(): string
    {
        return this._textTwo;
    }
    public get textDetails(): string
    {
        return this._textDetails;
    }
    public get textTeaser(): string
    {
        return this._textTeaser;
    }
    public get roomId(): number
    {
        return this._roomId;
    }
    public get includes(): string
    {
        return this._includes;
    }
}
