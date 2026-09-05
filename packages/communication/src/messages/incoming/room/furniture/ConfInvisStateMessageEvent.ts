import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ConfInvisStateMessageParser } from '../../../parser';

export class ConfInvisStateMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ConfInvisStateMessageParser);
    }

    public getParser(): ConfInvisStateMessageParser
    {
        return this.parser as ConfInvisStateMessageParser;
    }
}
