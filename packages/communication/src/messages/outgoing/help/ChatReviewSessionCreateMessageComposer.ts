import { IMessageComposer } from '@octane/api';

export class ChatReviewSessionCreateMessageComposer implements IMessageComposer<ConstructorParameters<typeof ChatReviewSessionCreateMessageComposer>>
{
    private _data: ConstructorParameters<typeof ChatReviewSessionCreateMessageComposer>;

    constructor(reviewedUserId: number, roomId: number)
    {
        this._data = [reviewedUserId, roomId];
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
