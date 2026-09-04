import { IMessageEvent, IMessageParser } from '@nitrots/api';
import { MessageEvent } from '@nitrots/events';
import { MessengerConversationsParser, MessengerHistoryParser, MessengerMessageAckParser, MessengerMessageFailedParser, MessengerMessageParser, MessengerReadCursorParser } from '../../parser';

abstract class TypedMessengerEvent<T extends IMessageParser> extends MessageEvent implements IMessageEvent
{
    public getParser(): T
    {
        return this.parser as T;
    }
}

export class MessengerConversationsEvent extends TypedMessengerEvent<MessengerConversationsParser>
{
    constructor(callback: Function)
    {
        super(callback, MessengerConversationsParser);
    }
}
export class MessengerHistoryEvent extends TypedMessengerEvent<MessengerHistoryParser>
{
    constructor(callback: Function)
    {
        super(callback, MessengerHistoryParser);
    }
}
export class MessengerMessageAckEvent extends TypedMessengerEvent<MessengerMessageAckParser>
{
    constructor(callback: Function)
    {
        super(callback, MessengerMessageAckParser);
    }
}
export class MessengerMessageFailedEvent extends TypedMessengerEvent<MessengerMessageFailedParser>
{
    constructor(callback: Function)
    {
        super(callback, MessengerMessageFailedParser);
    }
}
export class MessengerMessageEvent extends TypedMessengerEvent<MessengerMessageParser>
{
    constructor(callback: Function)
    {
        super(callback, MessengerMessageParser);
    }
}
export class MessengerReadCursorEvent extends TypedMessengerEvent<MessengerReadCursorParser>
{
    constructor(callback: Function)
    {
        super(callback, MessengerReadCursorParser);
    }
}
