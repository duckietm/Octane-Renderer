import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { GroupPurchasedParser } from '../../parser';

export class GroupPurchasedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, GroupPurchasedParser);
    }

    public getParser(): GroupPurchasedParser
    {
        return this.parser as GroupPurchasedParser;
    }
}
