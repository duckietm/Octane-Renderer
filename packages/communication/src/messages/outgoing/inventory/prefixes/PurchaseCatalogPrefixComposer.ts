import { IMessageComposer } from '@octane/api';

export class PurchaseCatalogPrefixComposer implements IMessageComposer<ConstructorParameters<typeof PurchaseCatalogPrefixComposer>>
{
    private _data: ConstructorParameters<typeof PurchaseCatalogPrefixComposer>;

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
        this._data = null;
    }
}
