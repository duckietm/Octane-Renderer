import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredTradeOpenMessageParser } from '../../../parser';

export class WiredTradeOpenEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredTradeOpenMessageParser);
    }

    public getParser(): WiredTradeOpenMessageParser
    {
        return this.parser as WiredTradeOpenMessageParser;
    }
}
