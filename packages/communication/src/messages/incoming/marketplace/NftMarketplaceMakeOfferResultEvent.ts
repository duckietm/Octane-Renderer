import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { NftMarketplaceMakeOfferResultParser } from '../../parser';

export class NftMarketplaceMakeOfferResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, NftMarketplaceMakeOfferResultParser);
    }

    public getParser(): NftMarketplaceMakeOfferResultParser
    {
        return this.parser as NftMarketplaceMakeOfferResultParser;
    }
}
