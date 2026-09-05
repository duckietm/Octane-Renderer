import { IMessageComposer } from '@octane/api';

export class GetCatalogPageExpirationComposer implements IMessageComposer<ConstructorParameters<typeof GetCatalogPageExpirationComposer>>
{
    private _data: ConstructorParameters<typeof GetCatalogPageExpirationComposer>;

    constructor(pageName: string)
    {
        this._data = [pageName];
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
