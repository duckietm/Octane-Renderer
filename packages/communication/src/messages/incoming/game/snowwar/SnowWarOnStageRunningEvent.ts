import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SnowWarOnStageRunningParser } from '../../../parser';

export class SnowWarOnStageRunningEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarOnStageRunningParser);
    }

    public getParser(): SnowWarOnStageRunningParser
    {
        return this.parser as SnowWarOnStageRunningParser;
    }
}
