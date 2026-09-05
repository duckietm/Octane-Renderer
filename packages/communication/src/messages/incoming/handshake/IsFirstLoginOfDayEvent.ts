import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { IsFirstLoginOfDayParser } from '../../parser';

export class IsFirstLoginOfDayEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, IsFirstLoginOfDayParser);
    }

    public getParser(): IsFirstLoginOfDayParser
    {
        return this.parser as IsFirstLoginOfDayParser;
    }
}
