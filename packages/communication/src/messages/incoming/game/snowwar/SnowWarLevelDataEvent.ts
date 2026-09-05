import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SnowWarLevelDataParser } from '../../../parser';

export class SnowWarLevelDataEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarLevelDataParser);
    }

    public getParser(): SnowWarLevelDataParser
    {
        return this.parser as SnowWarLevelDataParser;
    }
}
