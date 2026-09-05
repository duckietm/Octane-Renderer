import { IMessageComposer } from '@octane/api';

export class CatalogAdminMovePageComposer implements IMessageComposer<ConstructorParameters<typeof CatalogAdminMovePageComposer>>
{
    private _data: ConstructorParameters<typeof CatalogAdminMovePageComposer>;

    constructor(pageId: number, newParentId: number, newIndex: number, catalogMode: string = 'NORMAL', draftVersionId: number = 0, expectedRevision: number = 0, lockToken: string = '', summary: string = '', operationId: string = '')
    {
        this._data = [ pageId, newParentId, newIndex, catalogMode, draftVersionId, expectedRevision, lockToken, summary, operationId ];
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
