import { IMessageDataWrapper, IMessageParser } from '@octane/api';
export class MessengerMessageAckParser implements IMessageParser
{
    private _confirmationId=0; private _conversationId=0; private _messageId=0; private _createdAt=0;
    public flush()
    {
        this._confirmationId=this._conversationId=this._messageId=this._createdAt=0; return true;
    }
    public parse(w:IMessageDataWrapper)
    {
        if(!w) return false; this._confirmationId=w.readInt();this._conversationId=w.readInt();this._messageId=w.readInt();this._createdAt=w.readInt();return true;
    }
    get confirmationId()
    {
        return this._confirmationId;
    } get conversationId()
    {
        return this._conversationId;
    } get messageId()
    {
        return this._messageId;
    } get createdAt()
    {
        return this._createdAt;
    }
}
