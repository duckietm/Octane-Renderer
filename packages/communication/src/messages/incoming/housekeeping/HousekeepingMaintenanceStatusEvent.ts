import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { HousekeepingMaintenanceStatusParser } from '../../parser';

export class HousekeepingMaintenanceStatusEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HousekeepingMaintenanceStatusParser);
    }

    public getParser(): HousekeepingMaintenanceStatusParser
    {
        return this.parser as HousekeepingMaintenanceStatusParser;
    }
}
