import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WheelRecentWinsParser } from '../../parser';

export class WheelRecentWinsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WheelRecentWinsParser);
    }

    public getParser(): WheelRecentWinsParser
    {
        return this.parser as WheelRecentWinsParser;
    }
}
