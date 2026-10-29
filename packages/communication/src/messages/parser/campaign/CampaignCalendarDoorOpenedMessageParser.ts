import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class CampaignCalendarDoorOpenedMessageParser implements IMessageParser
{
    private _doorOpened: boolean;
    private _productName: string;
    private _customImage: string;
    private _furnitureClassName: string;
    private _badgeCode: string;
    private _credits: number;
    private _pixels: number;
    private _points: number;
    private _pointsType: number;
    private _subscriptionType: string;
    private _subscriptionDays: number;

    public flush(): boolean
    {
        this._doorOpened = false;
        this._productName = null;
        this._customImage = null;
        this._furnitureClassName = null;
        this._badgeCode = '';
        this._credits = 0;
        this._pixels = 0;
        this._points = 0;
        this._pointsType = 0;
        this._subscriptionType = '';
        this._subscriptionDays = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._doorOpened = wrapper.readBoolean();
        this._productName = wrapper.readString();
        this._customImage = wrapper.readString();
        this._furnitureClassName = wrapper.readString();

        // Octane servers also send what the reward holds; AIR's packet ends here.
        if(!wrapper.bytesAvailable) return true;

        this._badgeCode = wrapper.readString();
        this._credits = wrapper.readInt();
        this._pixels = wrapper.readInt();
        this._points = wrapper.readInt();
        this._pointsType = wrapper.readInt();
        this._subscriptionType = wrapper.readString();
        this._subscriptionDays = wrapper.readInt();

        return true;
    }

    public get doorOpened(): boolean
    {
        return this._doorOpened;
    }

    public get productName(): string
    {
        return this._productName;
    }

    public get customImage(): string
    {
        return this._customImage;
    }

    public get furnitureClassName(): string
    {
        return this._furnitureClassName;
    }

    public get badgeCode(): string
    {
        return this._badgeCode;
    }

    public get credits(): number
    {
        return this._credits;
    }

    public get pixels(): number
    {
        return this._pixels;
    }

    public get points(): number
    {
        return this._points;
    }

    public get pointsType(): number
    {
        return this._pointsType;
    }

    public get subscriptionType(): string
    {
        return this._subscriptionType;
    }

    public get subscriptionDays(): number
    {
        return this._subscriptionDays;
    }
}
