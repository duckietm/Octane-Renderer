import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { PurchaseErrorMessageParser } from '../../parser';

export class PurchaseErrorMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, PurchaseErrorMessageParser);
    }

    public getParser(): PurchaseErrorMessageParser
    {
        return this.parser as PurchaseErrorMessageParser;
    }
}
