import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class AuthenticatedParser implements IMessageParser
{
    private _sessionResumed: boolean = false;
    private _roomId: number = 0;
    private _recoveryToken: string = '';

    public flush(): boolean
    {
        this._sessionResumed = false;
        this._roomId = 0;
        this._recoveryToken = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._sessionResumed = wrapper.bytesAvailable ? wrapper.readBoolean() : false;
        this._roomId = wrapper.bytesAvailable ? Math.max(wrapper.readInt(), 0) : 0;
        this._recoveryToken = wrapper.bytesAvailable ? wrapper.readString() : '';

        return true;
    }

    public get sessionResumed(): boolean
    {
        return this._sessionResumed;
    }

    public get roomId(): number
    {
        return this._roomId;
    }

    public get recoveryToken(): string
    {
        return this._recoveryToken;
    }
}
