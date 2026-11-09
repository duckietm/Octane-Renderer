import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** AIR's Collectibles marketplace make-offer result, with the furni marketplace's codes (1 posted, 2 error, 3 disabled). */
export class NftMarketplaceMakeOfferResultParser implements IMessageParser
{
    private _result: number;

    public flush(): boolean
    {
        this._result = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._result = wrapper.readInt();

        return true;
    }

    public get result(): number
    {
        return this._result;
    }
}
