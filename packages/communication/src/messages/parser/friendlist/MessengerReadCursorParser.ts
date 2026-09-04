import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';
export class MessengerReadCursorParser implements IMessageParser
{
    private _conversationId=0;private _readerId=0;private _messageId=0; public flush()
    {
        this._conversationId=this._readerId=this._messageId=0;return true;
    } public parse(w:IMessageDataWrapper)
    {
        if(!w) return false;this._conversationId=w.readInt();this._readerId=w.readInt();this._messageId=w.readInt();return true;
    } get conversationId()
    {
        return this._conversationId;
    } get readerId()
    {
        return this._readerId;
    } get messageId()
    {
        return this._messageId;
    }
}
