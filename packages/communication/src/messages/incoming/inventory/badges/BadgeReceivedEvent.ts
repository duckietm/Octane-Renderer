import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { BadgeReceivedParser } from '../../../parser';

export class BadgeReceivedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BadgeReceivedParser);
    }

    public getParser(): BadgeReceivedParser
    {
        return this.parser as BadgeReceivedParser;
    }
}
