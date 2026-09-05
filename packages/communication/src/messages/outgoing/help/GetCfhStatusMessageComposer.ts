import { IMessageComposer } from '@octane/api';

export class GetCfhStatusMessageComposer implements IMessageComposer<ConstructorParameters<typeof GetCfhStatusMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetCfhStatusMessageComposer>;

    constructor(pendingOnly: boolean)
    {
        this._data = [pendingOnly];
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
