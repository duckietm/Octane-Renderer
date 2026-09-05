import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { TradingOpenFailedParser } from '../../../parser';

export class TradingOpenFailedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, TradingOpenFailedParser);
    }

    public getParser(): TradingOpenFailedParser
    {
        return this.parser as TradingOpenFailedParser;
    }
}
