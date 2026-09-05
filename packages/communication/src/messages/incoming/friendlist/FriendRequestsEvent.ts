import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FriendRequestsParser } from '../../parser';

export class FriendRequestsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FriendRequestsParser);
    }

    public getParser(): FriendRequestsParser
    {
        return this.parser as FriendRequestsParser;
    }
}
