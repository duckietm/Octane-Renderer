import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { GiftReceiverNotFoundParser } from '../../parser';

export class GiftReceiverNotFoundEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, GiftReceiverNotFoundParser);
    }

    public getParser(): GiftReceiverNotFoundParser
    {
        return this.parser;
    }
}
