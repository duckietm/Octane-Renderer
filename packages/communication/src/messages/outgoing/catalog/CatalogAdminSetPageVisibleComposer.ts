import { IMessageComposer } from '@nitrots/api';

export class CatalogAdminSetPageVisibleComposer implements IMessageComposer<ConstructorParameters<typeof CatalogAdminSetPageVisibleComposer>>
{
    private _data: ConstructorParameters<typeof CatalogAdminSetPageVisibleComposer>;

    constructor(pageId: number, visible: boolean, catalogMode: string = 'NORMAL', draftVersionId: number = 0, expectedRevision: number = 0, lockToken: string = '', summary: string = '', operationId: string = '')
    {
        this._data = [ pageId, visible, catalogMode, draftVersionId, expectedRevision, lockToken, summary, operationId ];
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
