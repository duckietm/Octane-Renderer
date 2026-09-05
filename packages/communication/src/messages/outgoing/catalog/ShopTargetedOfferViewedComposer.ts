import { IMessageComposer } from '@octane/api';

export class ShopTargetedOfferViewedComposer implements IMessageComposer<ConstructorParameters<typeof ShopTargetedOfferViewedComposer>>
{
    private _data: ConstructorParameters<typeof ShopTargetedOfferViewedComposer>;

    constructor(targetedOfferId: number, trackingState: number)
    {
        this._data = [targetedOfferId, trackingState];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
