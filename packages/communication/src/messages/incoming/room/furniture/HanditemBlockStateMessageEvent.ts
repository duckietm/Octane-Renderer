import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { HanditemBlockStateMessageParser } from '../../../parser';

export class HanditemBlockStateMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HanditemBlockStateMessageParser);
    }

    public getParser(): HanditemBlockStateMessageParser
    {
        return this.parser as HanditemBlockStateMessageParser;
    }
}
