import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class SnowWarUserChatParser implements IMessageParser
{
    private _objectId: number;
    private _message: string;

    public flush(): boolean
    {
        this._objectId = -1;
        this._message = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._objectId = wrapper.readInt();
        this._message = wrapper.readString();

        return true;
    }

    public get objectId(): number
    {
        return this._objectId;
    }

    public get message(): string
    {
        return this._message;
    }
}
