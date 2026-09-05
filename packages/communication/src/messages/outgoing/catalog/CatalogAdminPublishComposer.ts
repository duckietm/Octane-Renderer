import { IMessageComposer } from '@octane/api';

export class CatalogAdminPublishComposer implements IMessageComposer<ConstructorParameters<typeof CatalogAdminPublishComposer>>
{
    private _data: ConstructorParameters<typeof CatalogAdminPublishComposer>;

    constructor()
    {
        this._data = [];
    }

    dispose(): void
    {
        this._data = null;
    }

    public getMessageArray()
    {
        return this._data;
    }
}
