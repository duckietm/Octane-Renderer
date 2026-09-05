import { IMessageComposer } from '@octane/api';

export class SearchFaqsMessageComposer implements IMessageComposer<ConstructorParameters<typeof SearchFaqsMessageComposer>>
{
    private _data: ConstructorParameters<typeof SearchFaqsMessageComposer>;

    constructor(searchText: string)
    {
        this._data = [searchText];
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
