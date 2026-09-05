import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WheelDataParser } from '../../parser';

export class WheelDataEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WheelDataParser);
    }

    public getParser(): WheelDataParser
    {
        return this.parser as WheelDataParser;
    }
}
