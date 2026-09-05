import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { NewFriendRequestParser } from '../../parser';

export class NewFriendRequestEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, NewFriendRequestParser);
    }

    public getParser(): NewFriendRequestParser
    {
        return this.parser as NewFriendRequestParser;
    }
}
