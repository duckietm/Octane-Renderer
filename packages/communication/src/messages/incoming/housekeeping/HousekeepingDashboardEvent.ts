import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { HousekeepingDashboardParser } from '../../parser';

export class HousekeepingDashboardEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HousekeepingDashboardParser);
    }

    public getParser(): HousekeepingDashboardParser
    {
        return this.parser as HousekeepingDashboardParser;
    }
}
