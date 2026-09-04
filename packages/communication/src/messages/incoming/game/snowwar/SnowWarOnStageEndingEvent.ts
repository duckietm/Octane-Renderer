import { IMessageEvent } from '@nitrots/api';
import { MessageEvent } from '@nitrots/events';
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
