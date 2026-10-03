import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { HousekeepingListParser } from '../../parser';

export class HousekeepingListEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HousekeepingListParser);
    }

    public getParser(): HousekeepingListParser
    {
        return this.parser as HousekeepingListParser;
    }
}
