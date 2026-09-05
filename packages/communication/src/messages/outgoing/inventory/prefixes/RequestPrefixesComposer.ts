import { IMessageComposer } from '@octane/api';

export class RequestPrefixesComposer implements IMessageComposer<ConstructorParameters<typeof RequestPrefixesComposer>>
{
    private _data: ConstructorParameters<typeof RequestPrefixesComposer>;

    constructor()
    {
        this._data = [];
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
