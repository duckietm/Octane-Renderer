import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { HousekeepingActionLogParser } from '../../parser';

export class HousekeepingActionLogEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HousekeepingActionLogParser);
    }

    public getParser(): HousekeepingActionLogParser
    {
        return this.parser as HousekeepingActionLogParser;
    }
}
