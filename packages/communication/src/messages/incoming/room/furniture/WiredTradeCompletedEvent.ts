import { IMessageEvent } from '@nitrots/api';
import { MessageEvent } from '@nitrots/events';
import { WiredTradeCompletedMessageParser } from '../../../parser';

export class WiredTradeCompletedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredTradeCompletedMessageParser);
    }

    public getParser(): WiredTradeCompletedMessageParser
    {
        return this.parser as WiredTradeCompletedMessageParser;
    }
}
