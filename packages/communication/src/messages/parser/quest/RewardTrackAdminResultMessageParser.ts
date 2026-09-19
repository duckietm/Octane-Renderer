import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** RewardTrackAdminResult (10105): whether a staff editor write went through, and what it touched. */
export class RewardTrackAdminResultMessageParser implements IMessageParser
{
    private _success: boolean;
    private _message: string;
    private _entity: string;
    private _trackId: string;
    private _id: string;

    public flush(): boolean
    {
        this._success = false;
        this._message = '';
        this._entity = '';
        this._trackId = '';
        this._id = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._success = wrapper.readBoolean();
        this._message = wrapper.readString();
        this._entity = wrapper.readString();
        this._trackId = wrapper.readString();
        this._id = wrapper.readString();

        return true;
    }

    public get success(): boolean
    {
        return this._success;
    }

    public get message(): string
    {
        return this._message;
    }

    public get entity(): string
    {
        return this._entity;
    }

    public get trackId(): string
    {
        return this._trackId;
    }

    public get id(): string
    {
        return this._id;
    }
}
