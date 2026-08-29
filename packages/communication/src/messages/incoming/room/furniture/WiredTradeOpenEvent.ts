import { IMessageEvent } from '@nitrots/api';
import { MessageEvent } from '@nitrots/events';
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
