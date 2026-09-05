import { IMessageComposer } from '@octane/api';

export class SetActivePrefixComposer implements IMessageComposer<ConstructorParameters<typeof SetActivePrefixComposer>>
{
    private _data: ConstructorParameters<typeof SetActivePrefixComposer>;

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
