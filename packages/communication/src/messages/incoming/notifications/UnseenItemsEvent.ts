import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { UnseenItemsParser } from '../../parser';

export class UnseenItemsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UnseenItemsParser);
    }

    public getParser(): UnseenItemsParser
    {
        return this.parser as UnseenItemsParser;
    }
}
