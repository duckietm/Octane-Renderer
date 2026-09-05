import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { TradingConfirmationParser } from '../../../parser';

export class TradingConfirmationEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, TradingConfirmationParser);
    }

    public getParser(): TradingConfirmationParser
    {
        return this.parser;
    }
}
