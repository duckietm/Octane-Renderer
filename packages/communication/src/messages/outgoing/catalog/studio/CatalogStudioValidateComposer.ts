import { IMessageComposer } from '@nitrots/api';

export class CatalogStudioValidateComposer implements IMessageComposer<ConstructorParameters<typeof CatalogStudioValidateComposer>>
{
    private _data: ConstructorParameters<typeof CatalogStudioValidateComposer>;
    constructor(operationId: string, draftVersionId: number, expectedRevision: number)
    {
        this._data = [ operationId, draftVersionId, expectedRevision ];
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
