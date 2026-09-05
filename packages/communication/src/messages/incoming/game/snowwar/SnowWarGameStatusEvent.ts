import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SnowWarGameStatusParser } from '../../../parser';

export class SnowWarGameStatusEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarGameStatusParser);
    }

    public getParser(): SnowWarGameStatusParser
    {
        return this.parser as SnowWarGameStatusParser;
    }
}
