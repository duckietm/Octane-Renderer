import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * AIR's Collectibles marketplace item stats, in emeralds: the average price, the open offers, the history length,
 * the history days (offset, average, sold), the lowest open price and the suggested price. Unlike the furni stats it
 * does not echo the item: the client asked for one product code.
 */
export class NftMarketplaceItemStatsParser implements IMessageParser
{
    private _averagePrice: number;
    private _offerCount: number;
    private _historyLength: number;
    private _dayOffsets: number[];
    private _averagePrices: number[];
    private _soldAmounts: number[];
    private _lowestCurrentPrice: number;
    private _suggestedPrice: number;

    public flush(): boolean
    {
        this._averagePrice = 0;
        this._offerCount = 0;
        this._historyLength = 0;
        this._dayOffsets = [];
        this._averagePrices = [];
        this._soldAmounts = [];
        this._lowestCurrentPrice = 0;
        this._suggestedPrice = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._averagePrice = wrapper.readInt();
        this._offerCount = wrapper.readInt();
        this._historyLength = wrapper.readInt();

        let count = wrapper.readInt();

        while(count > 0)
        {
            this._dayOffsets.push(wrapper.readInt());
            this._averagePrices.push(wrapper.readInt());
            this._soldAmounts.push(wrapper.readInt());

            count--;
        }

        this._lowestCurrentPrice = wrapper.readInt();
        this._suggestedPrice = wrapper.readInt();

        return true;
    }

    public get averagePrice(): number
    {
        return this._averagePrice;
    }

    public get offerCount(): number
    {
        return this._offerCount;
    }

    public get historyLength(): number
    {
        return this._historyLength;
    }

    public get dayOffsets(): number[]
    {
        return this._dayOffsets;
    }

    public get averagePrices(): number[]
    {
        return this._averagePrices;
    }

    public get soldAmounts(): number[]
    {
        return this._soldAmounts;
    }

    public get lowestCurrentPrice(): number
    {
        return this._lowestCurrentPrice;
    }

    public get suggestedPrice(): number
    {
        return this._suggestedPrice;
    }
}
