import { IMessageComposer } from '@octane/api';

/** AIR `MarketplaceModel.makeNftOffer`: offers one collectible for emeralds; furniType is 1 floor, 2 wall. */
export class MakeNftMarketplaceOfferComposer implements IMessageComposer<ConstructorParameters<typeof MakeNftMarketplaceOfferComposer>>
{
    private _data: ConstructorParameters<typeof MakeNftMarketplaceOfferComposer>;

    constructor(furniType: number, itemId: number, price: number)
    {
        this._data = [furniType, itemId, price];
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
