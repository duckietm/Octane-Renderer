import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { HotelWillShutdownParser } from '../../parser';

export class HotelWillShutdownEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HotelWillShutdownParser);
    }

    public getParser(): HotelWillShutdownParser
    {
        return this.parser as HotelWillShutdownParser;
    }
}
