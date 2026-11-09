import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * AIR's Collectibles marketplace buy result: the result (`SUCCESS`, `NOT_ENOUGH_EMERALDS`, or another word for a
 * failure), the offer that was bought as a 64-bit integer, and its price in emeralds.
 */
export class NftMarketplaceBuyResultParser implements IMessageParser
{
    public static readonly RESULT_SUCCESS: string = 'SUCCESS';
    public static readonly RESULT_NOT_ENOUGH_EMERALDS: string = 'NOT_ENOUGH_EMERALDS';

    private _result: string;
    private _offerId: number;
    private _price: number;

    public flush(): boolean
    {
        this._result = '';
        this._offerId = 0;
        this._price = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._result = wrapper.readString();

        // Two big-endian ints: the high and the low half.
        const high = wrapper.readInt();
        const low = wrapper.readInt();

        this._offerId = ((high * 0x100000000) + (low >>> 0));
        this._price = wrapper.readInt();

        return true;
    }

    public get result(): string
    {
        return this._result;
    }

    public get offerId(): number
    {
        return this._offerId;
    }

    public get price(): number
    {
        return this._price;
    }
}
