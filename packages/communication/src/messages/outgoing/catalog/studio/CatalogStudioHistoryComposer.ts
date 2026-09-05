import { IMessageComposer } from '@octane/api';

export class CatalogStudioHistoryComposer implements IMessageComposer<ConstructorParameters<typeof CatalogStudioHistoryComposer>>
{
    private _data: ConstructorParameters<typeof CatalogStudioHistoryComposer>;
    constructor(draftVersionId: number, offset: number, limit: number)
    {
        this._data = [ draftVersionId, offset, limit ];
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
