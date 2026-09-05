import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SnowWarOnStageEndingParser } from '../../../parser';

export class SnowWarOnStageEndingEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarOnStageEndingParser);
    }

    public getParser(): SnowWarOnStageEndingParser
    {
        return this.parser;
    }
}
