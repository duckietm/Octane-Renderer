import { IMessageComposer } from '@octane/api';

export class CatalogStudioUndoComposer implements IMessageComposer<ConstructorParameters<typeof CatalogStudioUndoComposer>>
{
    private _data: ConstructorParameters<typeof CatalogStudioUndoComposer>;
    constructor(operationId: string, draftVersionId: number, expectedRevision: number, groupId: number)
    {
        this._data = [ operationId, draftVersionId, expectedRevision, groupId ];
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
