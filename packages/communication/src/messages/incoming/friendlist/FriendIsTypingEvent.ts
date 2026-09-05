import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FriendIsTypingParser } from '../../parser';

export class FriendIsTypingEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FriendIsTypingParser);
    }

    public getParser(): FriendIsTypingParser
    {
        return this.parser as FriendIsTypingParser;
    }
}
