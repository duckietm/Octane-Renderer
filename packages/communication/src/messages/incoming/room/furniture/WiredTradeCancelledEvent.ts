import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
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
