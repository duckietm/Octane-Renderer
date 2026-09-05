import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { TradingNoSuchItemParser } from '../../../parser';

export class TradingNoSuchItemEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, TradingNoSuchItemParser);
    }

    public getParser(): TradingNoSuchItemParser
    {
        return this.parser;
    }
}
