import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { TradingCompletedParser } from '../../../parser';

export class TradingCompletedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, TradingCompletedParser);
    }

    public getParser(): TradingCompletedParser
    {
        return this.parser;
    }
}
