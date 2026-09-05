import { IMessageComposer } from '@octane/api';

export class ChatReviewGuideDecidesOnOfferMessageComposer implements IMessageComposer<ConstructorParameters<typeof ChatReviewGuideDecidesOnOfferMessageComposer>>
{
    private _data: ConstructorParameters<typeof ChatReviewGuideDecidesOnOfferMessageComposer>;

    constructor(accept: boolean)
    {
        this._data = [accept];
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
