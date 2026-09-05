import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SnowWarGameEndedParser } from '../../../parser';

export class SnowWarGameEndedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarGameEndedParser);
    }

    public getParser(): SnowWarGameEndedParser
    {
        return this.parser;
    }
}
