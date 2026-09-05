import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { MarketplaceOffersParser } from '../../parser';

export class MarketPlaceOffersEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, MarketplaceOffersParser);
    }

    public getParser(): MarketplaceOffersParser
    {
        return this.parser as MarketplaceOffersParser;
    }
}
