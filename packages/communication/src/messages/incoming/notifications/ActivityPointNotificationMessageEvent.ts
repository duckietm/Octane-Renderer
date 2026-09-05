import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ActivityPointNotificationParser } from '../../parser';

export class ActivityPointNotificationMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ActivityPointNotificationParser);
    }

    public getParser(): ActivityPointNotificationParser
    {
        return this.parser as ActivityPointNotificationParser;
    }
}
