import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CitizenshipVipOfferPromoEnabledParser } from '../../parser';

export class CitizenshipVipOfferPromoEnabledEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CitizenshipVipOfferPromoEnabledParser);
    }

    public getParser(): CitizenshipVipOfferPromoEnabledParser
    {
        return this.parser;
    }
}
