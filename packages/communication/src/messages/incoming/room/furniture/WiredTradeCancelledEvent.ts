import { IMessageEvent } from '@nitrots/api';
import { MessageEvent } from '@nitrots/events';
import { WiredTradeCancelledMessageParser } from '../../../parser';

export class WiredTradeCancelledEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredTradeCancelledMessageParser);
    }

    public getParser(): WiredTradeCancelledMessageParser
    {
        return this.parser as WiredTradeCancelledMessageParser;
    }
}
