import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WheelResultParser } from '../../parser';

export class WheelResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WheelResultParser);
    }

    public getParser(): WheelResultParser
    {
        return this.parser as WheelResultParser;
    }
}
