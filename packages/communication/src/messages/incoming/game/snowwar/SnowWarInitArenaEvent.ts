import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SnowWarInitArenaParser } from '../../../parser';

export class SnowWarInitArenaEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarInitArenaParser);
    }

    public getParser(): SnowWarInitArenaParser
    {
        return this.parser;
    }
}
