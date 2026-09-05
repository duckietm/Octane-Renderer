import { IMessageComposer } from '@octane/api';

export class CatalogStudioExportComposer implements IMessageComposer<ConstructorParameters<typeof CatalogStudioExportComposer>>
{
    private _data: ConstructorParameters<typeof CatalogStudioExportComposer>;
    constructor(operationId: string, draftVersionId: number, expectedRevision: number, format: 'SQL')
    {
        this._data = [ operationId, draftVersionId, expectedRevision, format ];
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
