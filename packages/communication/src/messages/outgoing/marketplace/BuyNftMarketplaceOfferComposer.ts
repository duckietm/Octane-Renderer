import { IMessageComposer } from '@octane/api';

/** AIR `HabboCatalog.buyNftMarketPlaceOffer`: buys the cheapest open offer of a collectible (its product code) at most at the price shown. */
export class BuyNftMarketplaceOfferComposer implements IMessageComposer<ConstructorParameters<typeof BuyNftMarketplaceOfferComposer>>
{
    private _data: ConstructorParameters<typeof BuyNftMarketplaceOfferComposer>;

    constructor(productCode: string, price: number)
    {
        this._data = [productCode, price];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        this._data = null;
    }
}
