import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SnowWarPlayerExitedArenaParser } from '../../../parser';

export class SnowWarPlayerExitedArenaEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarPlayerExitedArenaParser);
    }

    public getParser(): SnowWarPlayerExitedArenaParser
    {
        return this.parser as SnowWarPlayerExitedArenaParser;
    }
}
