import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SnowWarOnStageStartParser } from '../../../parser';

export class SnowWarOnStageStartEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarOnStageStartParser);
    }

    public getParser(): SnowWarOnStageStartParser
    {
        return this.parser as SnowWarOnStageStartParser;
    }
}
