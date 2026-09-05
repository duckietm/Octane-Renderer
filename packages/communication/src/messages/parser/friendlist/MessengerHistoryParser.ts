import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { MessengerMessageData, parseMessengerMessage } from './MessengerData';

export class MessengerHistoryParser implements IMessageParser
{
    private _conversationId = 0; private _hasMore = false; private _messages: MessengerMessageData[] = [];
    public flush(): boolean
    {
        this._conversationId = 0; this._hasMore = false; this._messages = []; return true;
    }
    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;
        this._conversationId = wrapper.readInt(); this._hasMore = wrapper.readBoolean();
        const count = wrapper.readInt(); if(count < 0 || count > 50) return false;
        for(let i = 0; i < count; i++) this._messages.push(parseMessengerMessage(wrapper, this._conversationId));
        return true;
    }
    public get conversationId()
    {
        return this._conversationId;
    } public get hasMore()
    {
        return this._hasMore;
    } public get messages()
    {
        return this._messages;
    }
}
