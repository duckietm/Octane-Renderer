import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class MarketplaceConfigurationMessageParser implements IMessageParser
{
    private _enabled: boolean;
    private _commission: number;
    private _credits: number;
    private _advertisements: number;
    private _maximumPrice: number;
    private _minimumPrice: number;
    private _offerTime: number;
    private _displayTime: number;
    private _sellingFeePercentage: number;
    private _revenueLimit: number;
    private _halfTaxLimit: number;
    private _nftEnabled: boolean;
    private _nftMinimumPrice: number;
    private _nftMaximumPrice: number;
    private _nftOfferMinutes: number;
    private _nftMaximumOpenOffers: number;
    private _nftSellingFeePercentage: number;
    private _nftHalfTaxLimit: number;

    public flush(): boolean
    {
        this._enabled = false;
        this._commission = 0;
        this._credits = 0;
        this._advertisements = 0;
        this._maximumPrice = 0;
        this._minimumPrice = 0;
        this._offerTime = 0;
        this._displayTime = 0;
        this._sellingFeePercentage = 0;
        this._revenueLimit = 0;
        this._halfTaxLimit = 0;
        this._nftEnabled = false;
        this._nftMinimumPrice = 0;
        this._nftMaximumPrice = 0;
        this._nftOfferMinutes = 0;
        this._nftMaximumOpenOffers = 0;
        this._nftSellingFeePercentage = 0;
        this._nftHalfTaxLimit = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._enabled = wrapper.readBoolean();
        this._commission = wrapper.readInt();
        this._credits = wrapper.readInt();
        this._advertisements = wrapper.readInt();
        this._minimumPrice = wrapper.readInt();
        this._maximumPrice = wrapper.readInt();
        this._offerTime = wrapper.readInt();
        this._displayTime = wrapper.readInt();

        // AIR's seller fee fields, then its Collectibles marketplace part: both only while bytes remain.
        if(!wrapper.bytesAvailable) return true;

        this._sellingFeePercentage = wrapper.readInt();
        this._revenueLimit = wrapper.readInt();
        this._halfTaxLimit = wrapper.readInt();

        if(!wrapper.bytesAvailable) return true;

        this._nftEnabled = wrapper.readBoolean();
        this._nftMinimumPrice = wrapper.readInt();
        this._nftMaximumPrice = wrapper.readInt();
        this._nftOfferMinutes = wrapper.readInt();
        this._nftMaximumOpenOffers = wrapper.readInt();
        this._nftSellingFeePercentage = wrapper.readInt();
        this._nftHalfTaxLimit = wrapper.readInt();

        return true;
    }

    public get enabled(): boolean
    {
        return this._enabled;
    }

    public get commission(): number
    {
        return this._commission;
    }

    public get credits(): number
    {
        return this._credits;
    }

    public get advertisements(): number
    {
        return this._advertisements;
    }

    public get minimumPrice(): number
    {
        return this._minimumPrice;
    }

    public get maximumPrice(): number
    {
        return this._maximumPrice;
    }

    public get offerTime(): number
    {
        return this._offerTime;
    }

    public get displayTime(): number
    {
        return this._displayTime;
    }

    public get sellingFeePercentage(): number
    {
        return this._sellingFeePercentage;
    }

    public get revenueLimit(): number
    {
        return this._revenueLimit;
    }

    public get halfTaxLimit(): number
    {
        return this._halfTaxLimit;
    }

    /** The Collectibles marketplace (nft_* furni sold for emeralds) is on. */
    public get nftEnabled(): boolean
    {
        return this._nftEnabled;
    }

    public get nftMinimumPrice(): number
    {
        return this._nftMinimumPrice;
    }

    public get nftMaximumPrice(): number
    {
        return this._nftMaximumPrice;
    }

    public get nftOfferMinutes(): number
    {
        return this._nftOfferMinutes;
    }

    public get nftMaximumOpenOffers(): number
    {
        return this._nftMaximumOpenOffers;
    }

    public get nftSellingFeePercentage(): number
    {
        return this._nftSellingFeePercentage;
    }

    public get nftHalfTaxLimit(): number
    {
        return this._nftHalfTaxLimit;
    }
}
