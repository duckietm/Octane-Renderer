import { IMessageComposer } from '@octane/api';

/** AIR's Collectibles marketplace item stats, asked by product code. */
export class GetNftMarketplaceItemStatsComposer implements IMessageComposer<ConstructorParameters<typeof GetNftMarketplaceItemStatsComposer>>
{
    private _data: ConstructorParameters<typeof GetNftMarketplaceItemStatsComposer>;

    constructor(productCode: string)
    {
        this._data = [productCode];
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
