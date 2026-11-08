import { IMessageDataWrapper } from '@octane/api';

export class ModeratorUserRecordData
{
    private _timestamp: number;
    private _username: string;
    private _staffName: string;
    private _type: string;
    private _reason: string;
    private _expires: number;

    constructor(wrapper: IMessageDataWrapper)
    {
        this._timestamp = wrapper.readInt();
        this._username = wrapper.readString();
        this._staffName = wrapper.readString();
        this._type = wrapper.readString();
        this._reason = wrapper.readString();
        this._expires = wrapper.readInt();
    }

    public get timestamp(): number
    {
        return this._timestamp;
    }

    public get username(): string
    {
        return this._username;
    }

    public get staffName(): string
    {
        return this._staffName;
    }

    public get type(): string
    {
        return this._type;
    }

    public get reason(): string
    {
        return this._reason;
    }

    public get expires(): number
    {
        return this._expires;
    }
}
