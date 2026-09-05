import { IMessageComposer } from '@octane/api';

export class CatalogAdminDeletePageComposer implements IMessageComposer<ConstructorParameters<typeof CatalogAdminDeletePageComposer>>
{
    private _data: ConstructorParameters<typeof CatalogAdminDeletePageComposer>;

    constructor(pageId: number, catalogMode: string = 'NORMAL', draftVersionId: number = 0, expectedRevision: number = 0, lockToken: string = '', summary: string = '', operationId: string = '')
    {
        this._data = [ pageId, catalogMode, draftVersionId, expectedRevision, lockToken, summary, operationId ];
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
