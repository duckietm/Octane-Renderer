import { IMessageComposer } from '@octane/api';

export class CatalogAdminSavePageIconComposer implements IMessageComposer<ConstructorParameters<typeof CatalogAdminSavePageIconComposer>>
{
    private _data: ConstructorParameters<typeof CatalogAdminSavePageIconComposer>;

    constructor(
        pageId: number,
        iconId: number,
        catalogType: string = 'NORMAL',
        draftVersionId: number = 0,
        expectedRevision: number = 0,
        lockToken: string = '',
        summary: string = '',
        operationId: string = '')
    {
        this._data = [ pageId, iconId, catalogType, draftVersionId, expectedRevision, lockToken, summary, operationId ];
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
