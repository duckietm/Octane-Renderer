import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { OfferRewardDeliveredMessageParser } from '../../parser';

export class OfferRewardDeliveredMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, OfferRewardDeliveredMessageParser);
    }

    public getParser(): OfferRewardDeliveredMessageParser
    {
        return this.parser as OfferRewardDeliveredMessageParser;
    }
}
