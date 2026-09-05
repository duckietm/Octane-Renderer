import { IMessageComposer } from '@octane/api';

export class RenameFriendCategoryComposer implements IMessageComposer<ConstructorParameters<typeof RenameFriendCategoryComposer>>
{
    private _data: ConstructorParameters<typeof RenameFriendCategoryComposer>;

    constructor(categoryId: number, name: string)
    {
        this._data = [ categoryId, name ];
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
