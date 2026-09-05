import { IMessageComposer } from '@octane/api';

export class AddFriendCategoryComposer implements IMessageComposer<ConstructorParameters<typeof AddFriendCategoryComposer>>
{
    private _data: ConstructorParameters<typeof AddFriendCategoryComposer>;

    constructor(name: string)
    {
        this._data = [ name ];
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
