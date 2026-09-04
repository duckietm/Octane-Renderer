import { IMessageEvent } from '@nitrots/api';
import { MessageEvent } from '@nitrots/events';
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
