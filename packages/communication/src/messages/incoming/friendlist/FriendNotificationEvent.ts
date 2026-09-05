import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FriendNotificationParser } from '../../parser';

export class FriendNotificationEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FriendNotificationParser);
    }

    public getParser(): FriendNotificationParser
    {
        return this.parser as FriendNotificationParser;
    }
}
