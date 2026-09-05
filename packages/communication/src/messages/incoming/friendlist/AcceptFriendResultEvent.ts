import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { AcceptFriendResultParser } from '../../parser';

export class AcceptFriendResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, AcceptFriendResultParser);
    }

    public getParser(): AcceptFriendResultParser
    {
        return this.parser as AcceptFriendResultParser;
    }
}
