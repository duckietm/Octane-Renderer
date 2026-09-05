import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SnowWarUserRematchedParser } from '../../../parser';

export class SnowWarUserRematchedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarUserRematchedParser);
    }

    public getParser(): SnowWarUserRematchedParser
    {
        return this.parser as SnowWarUserRematchedParser;
    }
}
