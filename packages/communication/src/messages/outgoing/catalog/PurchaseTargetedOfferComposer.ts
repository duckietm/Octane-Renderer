import { IMessageComposer } from '@octane/api';

export class PurchaseTargetedOfferComposer implements IMessageComposer<ConstructorParameters<typeof PurchaseTargetedOfferComposer>>
{
    private _data: ConstructorParameters<typeof PurchaseTargetedOfferComposer>;

    constructor(offerId: number, quantity: number)
    {
        this._data = [offerId, quantity];
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
