import { IMessageComposer } from '@octane/api';

export class GetNextTargetedOfferComposer implements IMessageComposer<ConstructorParameters<typeof GetNextTargetedOfferComposer>>
{
    private _data: ConstructorParameters<typeof GetNextTargetedOfferComposer>;

    constructor(offerId: number)
    {
        this._data = [offerId];
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
