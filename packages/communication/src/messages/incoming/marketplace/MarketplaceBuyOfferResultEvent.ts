import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { MarketplaceBuyOfferResultParser } from '../../parser';


export class MarketplaceBuyOfferResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, MarketplaceBuyOfferResultParser);
    }

    public getParser(): MarketplaceBuyOfferResultParser
    {
        return this.parser as MarketplaceBuyOfferResultParser;
    }
}
