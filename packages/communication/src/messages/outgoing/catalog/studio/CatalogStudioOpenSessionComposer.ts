import { IMessageComposer } from '@octane/api';

export class CatalogStudioOpenSessionComposer implements IMessageComposer<ConstructorParameters<typeof CatalogStudioOpenSessionComposer>>
{
    private _data: ConstructorParameters<typeof CatalogStudioOpenSessionComposer>;
    constructor()
    {
        this._data = [];
    }
    public dispose(): void
    {
        this._data = null;
    }
    public getMessageArray()
    {
        return this._data;
    }
}
