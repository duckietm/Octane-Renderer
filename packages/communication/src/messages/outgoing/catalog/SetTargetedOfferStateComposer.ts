import { IMessageComposer } from '@octane/api';

export class SetTargetedOfferStateComposer implements IMessageComposer<ConstructorParameters<typeof SetTargetedOfferStateComposer>>
{
    private _data: ConstructorParameters<typeof SetTargetedOfferStateComposer>;

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
