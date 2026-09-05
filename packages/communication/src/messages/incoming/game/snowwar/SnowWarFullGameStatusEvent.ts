import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SnowWarFullGameStatusParser } from '../../../parser';

export class SnowWarFullGameStatusEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarFullGameStatusParser);
    }

    public getParser(): SnowWarFullGameStatusParser
    {
        return this.parser as SnowWarFullGameStatusParser;
    }
}
