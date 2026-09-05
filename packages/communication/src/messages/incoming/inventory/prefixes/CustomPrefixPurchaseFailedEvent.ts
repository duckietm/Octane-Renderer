import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CustomPrefixPurchaseFailedParser } from '../../../parser';

export class CustomPrefixPurchaseFailedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CustomPrefixPurchaseFailedParser);
    }

    public getParser(): CustomPrefixPurchaseFailedParser
    {
        return this.parser as CustomPrefixPurchaseFailedParser;
    }
}
