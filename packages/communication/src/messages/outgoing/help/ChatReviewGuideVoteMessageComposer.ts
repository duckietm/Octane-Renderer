import { IMessageComposer } from '@octane/api';

export class ChatReviewGuideVoteMessageComposer implements IMessageComposer<ConstructorParameters<typeof ChatReviewGuideVoteMessageComposer>>
{
    private _data: ConstructorParameters<typeof ChatReviewGuideVoteMessageComposer>;

    constructor(vote: number)
    {
        this._data = [vote];
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
