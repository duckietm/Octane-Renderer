import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredTradeItemsMessageParser } from '../../../parser';

export class WiredTradeItemsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredTradeItemsMessageParser);
    }

    public getParser(): WiredTradeItemsMessageParser
    {
        return this.parser as WiredTradeItemsMessageParser;
    }
}
