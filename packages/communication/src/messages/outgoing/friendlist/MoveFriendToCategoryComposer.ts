import { IMessageComposer } from '@octane/api';

export class MoveFriendToCategoryComposer implements IMessageComposer<ConstructorParameters<typeof MoveFriendToCategoryComposer>>
{
    private _data: ConstructorParameters<typeof MoveFriendToCategoryComposer>;

    constructor(friendId: number, categoryId: number)
    {
        this._data = [ friendId, categoryId ];
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
