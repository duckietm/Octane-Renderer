import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { MarketplaceCanMakeOfferResultParser } from '../../parser';


export class MarketplaceCanMakeOfferResult extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, MarketplaceCanMakeOfferResultParser);
    }

    public getParser(): MarketplaceCanMakeOfferResultParser
    {
        return this.parser as MarketplaceCanMakeOfferResultParser;
    }
}
