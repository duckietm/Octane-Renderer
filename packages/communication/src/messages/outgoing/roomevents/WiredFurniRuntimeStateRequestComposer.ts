import { IMessageComposer } from '@octane/api';

export class WiredFurniRuntimeStateRequestComposer implements IMessageComposer<ConstructorParameters<typeof WiredFurniRuntimeStateRequestComposer>>
{
    private _data: ConstructorParameters<typeof WiredFurniRuntimeStateRequestComposer>;

    constructor(itemId: number, action: number, key: string, value: number)
    {
        this._data = [ itemId, action, key, value ];
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
