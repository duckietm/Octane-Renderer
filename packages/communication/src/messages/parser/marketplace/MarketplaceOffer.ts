import { IObjectData } from '@octane/api';

export class MarketplaceOffer
{
    private readonly _offerId: number;
    private readonly _furniId: number;
    private readonly _furniType: number;
    private readonly _extraData: string;
    private readonly _stuffData: IObjectData;
    private readonly _price: number;
    private readonly _status: number;
    private readonly _timeLeftMinutes: number = -1;
    private readonly _averagePrice: number;
    private readonly _offerCount: number;
    private readonly _productCode: string;
    private readonly _nftFurniType: number;

    /** AIR's offer type of a collectible (an nft_* furni sold for emeralds). */
    public static readonly TYPE_NFT: number = 5;

    constructor(offerId: number, furniId: number, furniType: number, extraData: string, stuffData: IObjectData, price: number, status: number, timeLeftMinutes: number, averagePrice: number, offerCount: number = -1, productCode: string = null, nftFurniType: number = 0)
    {
        this._productCode = productCode;
        this._nftFurniType = nftFurniType;
        this._offerId = offerId;
        this._furniId = furniId;
        this._furniType = furniType;
        this._extraData = extraData;
        this._stuffData = stuffData;
        this._price = price;
        this._status = status;
        this._timeLeftMinutes = timeLeftMinutes;
        this._averagePrice = averagePrice;
        this._offerCount = offerCount;
    }

    /** A collectible: priced in emeralds, named and drawn by its {@link nftFurniType} (1 floor, 2 wall). */
    public get isNft(): boolean
    {
        return (this._furniType === MarketplaceOffer.TYPE_NFT);
    }

    /** The collectible's product code: its furni class name. */
    public get productCode(): string
    {
        return this._productCode;
    }

    public get nftFurniType(): number
    {
        return this._nftFurniType;
    }

    public get offerId(): number
    {
        return this._offerId;
    }

    public get furniId(): number
    {
        return this._furniId;
    }

    public get furniType(): number
    {
        return this._furniType;
    }

    public get extraData(): string
    {
        return this._extraData;
    }

    public get stuffData(): IObjectData
    {
        return this._stuffData;
    }

    public get price(): number
    {
        return this._price;
    }

    public get status(): number
    {
        return this._status;
    }

    public get timeLeftMinutes(): number
    {
        return this._timeLeftMinutes;
    }

    public get averagePrice(): number
    {
        return this._averagePrice;
    }

    public get offerCount(): number
    {
        return this._offerCount;
    }

    public get isUniqueLimitedItem(): boolean
    {
        return (!(this.stuffData == null)) && (this.stuffData.uniqueSeries > 0);
    }
}
