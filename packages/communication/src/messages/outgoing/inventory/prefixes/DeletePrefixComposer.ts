import { IMessageComposer } from '@octane/api';

export class DeletePrefixComposer implements IMessageComposer<ConstructorParameters<typeof DeletePrefixComposer>>
{
    private _data: ConstructorParameters<typeof DeletePrefixComposer>;

    constructor(prefixId: number)
    {
        this._data = [ prefixId ];
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
