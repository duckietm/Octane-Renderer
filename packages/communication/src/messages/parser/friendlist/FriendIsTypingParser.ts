import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class FriendIsTypingParser implements IMessageParser
{
    private _senderId: number;
    private _isTyping: boolean;

    public flush(): boolean
    {
        this._senderId = 0;
        this._isTyping = false;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._senderId = wrapper.readInt();
        this._isTyping = wrapper.readBoolean();

        return true;
    }

    public get senderId(): number
    {
        return this._senderId;
    }

    public get isTyping(): boolean
    {
        return this._isTyping;
    }
}
