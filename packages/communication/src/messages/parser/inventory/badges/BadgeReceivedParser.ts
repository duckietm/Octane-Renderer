import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';

export class BadgeReceivedParser implements IMessageParser
{
    private _badgeId: number;
    private _badgeCode: string;
    private _senderName: string;

    public flush(): boolean
    {
        this._badgeId = 0;
        this._badgeCode = null;
        this._senderName = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._badgeId = wrapper.readInt();
        this._badgeCode = wrapper.readString();
        this._senderName = wrapper.bytesAvailable ? wrapper.readString() : '';

        return true;
    }

    public get badgeId(): number
    {
        return this._badgeId;
    }

    public get badgeCode(): string
    {
        return this._badgeCode;
    }

    public get senderName(): string
    {
        return this._senderName;
    }
}