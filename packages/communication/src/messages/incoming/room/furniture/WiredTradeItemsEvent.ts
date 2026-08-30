import { IMessageEvent } from '@nitrots/api';
import { MessageEvent } from '@nitrots/events';
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
