import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredTradeCompletedMessageParser } from '../../../parser';

export class WiredTradeCompletedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredTradeCompletedMessageParser);
    }

    public getParser(): WiredTradeCompletedMessageParser
    {
        return this.parser;
    }
}
