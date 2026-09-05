import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SnowWarGenericErrorParser } from '../../../parser';

export class SnowWarGenericErrorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarGenericErrorParser);
    }

    public getParser(): SnowWarGenericErrorParser
    {
        return this.parser as SnowWarGenericErrorParser;
    }
}
