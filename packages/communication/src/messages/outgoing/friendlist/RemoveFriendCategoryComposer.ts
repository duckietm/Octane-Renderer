import { IMessageComposer } from '@octane/api';

export class RemoveFriendCategoryComposer implements IMessageComposer<ConstructorParameters<typeof RemoveFriendCategoryComposer>>
{
    private _data: ConstructorParameters<typeof RemoveFriendCategoryComposer>;

    constructor(categoryId: number)
    {
        this._data = [ categoryId ];
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
