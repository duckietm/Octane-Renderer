import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { HousekeepingActionResultParser } from '../../parser';

export class HousekeepingActionResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HousekeepingActionResultParser);
    }

    public getParser(): HousekeepingActionResultParser
    {
        return this.parser as HousekeepingActionResultParser;
    }
}
