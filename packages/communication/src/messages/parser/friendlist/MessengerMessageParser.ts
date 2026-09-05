import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { MessengerMessageData, parseMessengerMessage } from './MessengerData';
export class MessengerMessageParser implements IMessageParser
{
    private _message:MessengerMessageData=null; public flush()
    {
        this._message=null;return true;
    } public parse(w:IMessageDataWrapper)
    {
        if(!w) return false;const conversationId=w.readInt();this._message=parseMessengerMessage(w,conversationId);return true;
    } get message()
    {
        return this._message;
    }
}
