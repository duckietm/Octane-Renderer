import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { TradingYouAreNotAllowedParser } from '../../../parser';

export class TradingYouAreNotAllowedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, TradingYouAreNotAllowedParser);
    }

    public getParser(): TradingYouAreNotAllowedParser
    {
        return this.parser;
    }
}
