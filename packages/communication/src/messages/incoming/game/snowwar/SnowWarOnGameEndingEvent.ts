import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SnowWarOnGameEndingParser } from '../../../parser';

export class SnowWarOnGameEndingEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarOnGameEndingParser);
    }

    public getParser(): SnowWarOnGameEndingParser
    {
        return this.parser as SnowWarOnGameEndingParser;
    }
}
