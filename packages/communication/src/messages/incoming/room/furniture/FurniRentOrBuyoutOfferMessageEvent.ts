import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FurniRentOrBuyoutOfferMessageParser } from '../../../parser';

export class FurniRentOrBuyoutOfferMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FurniRentOrBuyoutOfferMessageParser);
    }

    public getParser(): FurniRentOrBuyoutOfferMessageParser
    {
        return this.parser as FurniRentOrBuyoutOfferMessageParser;
    }
}
