import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** CitizenshipVipOfferPromoEnabled (2764): no body; the citizenship track just gave free club days. */
export class CitizenshipVipOfferPromoEnabledParser implements IMessageParser
{
    public flush(): boolean
    {
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        return !!wrapper;
    }
}
