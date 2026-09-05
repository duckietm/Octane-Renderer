import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { HotelViewLandingParser } from '../../parser';

export class HotelViewLandingEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HotelViewLandingParser);
    }

    public getParser(): HotelViewLandingParser
    {
        return this.parser as HotelViewLandingParser;
    }
}
