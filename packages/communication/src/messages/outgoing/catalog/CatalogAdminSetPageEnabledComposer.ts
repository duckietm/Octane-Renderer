import { IMessageComposer } from '@nitrots/api';

export class CatalogAdminSetPageEnabledComposer implements IMessageComposer<ConstructorParameters<typeof CatalogAdminSetPageEnabledComposer>>
{
    private _data: ConstructorParameters<typeof CatalogAdminSetPageEnabledComposer>;

    constructor(pageId: number, enabled: boolean, catalogMode: string = 'NORMAL', draftVersionId: number = 0, expectedRevision: number = 0, lockToken: string = '', summary: string = '', operationId: string = '')
    {
        this._data = [ pageId, enabled, catalogMode, draftVersionId, expectedRevision, lockToken, summary, operationId ];
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
