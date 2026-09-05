import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { HotelMergeNameChangeParser } from '../../parser';

export class HotelMergeNameChangeEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HotelMergeNameChangeParser);
    }

    public getParser(): HotelMergeNameChangeParser
    {
        return this.parser;
    }
}
