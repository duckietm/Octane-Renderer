import { IMessageComposer } from '@octane/api';

export class CatalogAdminLoadPageComposer implements IMessageComposer<ConstructorParameters<typeof CatalogAdminLoadPageComposer>>
{
    private _data: ConstructorParameters<typeof CatalogAdminLoadPageComposer>;

    constructor(pageId: number, catalogMode: string = 'NORMAL', draftVersionId: number = 0, expectedRevision: number = 0)
    {
        this._data = [ pageId, catalogMode, draftVersionId, expectedRevision ];
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
