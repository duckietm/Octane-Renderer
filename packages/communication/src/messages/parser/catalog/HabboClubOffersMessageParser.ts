import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { ClubOfferData } from './ClubOfferData';

export class HabboClubOffersMessageParser implements IMessageParser
{
    private _offers: ClubOfferData[];
    private _windowId = 1;

    public flush(): boolean
    {
        this._offers = [];
        this._windowId = 1;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        let totalOffers = wrapper.readInt();

        while(totalOffers > 0)
        {
            this._offers.push(new ClubOfferData(wrapper));

            totalOffers--;
        }

        if(wrapper.bytesAvailable) this._windowId = wrapper.readInt();

        return true;
    }

    public get offers(): ClubOfferData[]
    {
        return this._offers;
    }

    public get windowId(): number
    {
        return this._windowId;
    }
}
