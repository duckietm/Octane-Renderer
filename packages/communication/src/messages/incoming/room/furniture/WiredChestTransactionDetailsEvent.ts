import { IMessageEvent } from '@nitrots/api';
import { MessageEvent } from '@nitrots/events';
import { WiredChestTransactionDetailsMessageParser } from '../../../parser';

export class WiredChestTransactionDetailsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredChestTransactionDetailsMessageParser);
    }

    public getParser(): WiredChestTransactionDetailsMessageParser
    {
        return this.parser as WiredChestTransactionDetailsMessageParser;
    }
}
