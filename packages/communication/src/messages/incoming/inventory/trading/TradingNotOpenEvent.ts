import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { TradingNotOpenParser } from '../../../parser';

export class TradingNotOpenEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, TradingNotOpenParser);
    }

    public getParser(): TradingNotOpenParser
    {
        return this.parser;
    }
}
