import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { IssueCloseNotificationMessageParser } from '../../parser';

export class IssueCloseNotificationMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, IssueCloseNotificationMessageParser);
    }

    public getParser(): IssueCloseNotificationMessageParser
    {
        return this.parser as IssueCloseNotificationMessageParser;
    }
}
