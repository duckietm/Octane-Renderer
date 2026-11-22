import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { HotelSettingsParser } from '../../parser';

export class HotelSettingsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HotelSettingsParser);
    }

    public getParser(): HotelSettingsParser
    {
        return this.parser as HotelSettingsParser;
    }
}
