import { IMessageComposer } from '@octane/api';

export class PurchaseNickIconComposer implements IMessageComposer<ConstructorParameters<typeof PurchaseNickIconComposer>>
{
    private _data: ConstructorParameters<typeof PurchaseNickIconComposer>;

    constructor(iconKey: string)
    {
        this._data = [ iconKey ];
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
