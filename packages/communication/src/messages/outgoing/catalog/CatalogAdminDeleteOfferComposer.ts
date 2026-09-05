import { IMessageComposer } from '@octane/api';

export class CatalogAdminDeleteOfferComposer implements IMessageComposer<ConstructorParameters<typeof CatalogAdminDeleteOfferComposer>>
{
    private _data: ConstructorParameters<typeof CatalogAdminDeleteOfferComposer>;

    constructor(offerId: number, catalogMode: string = 'NORMAL', draftVersionId: number = 0, expectedRevision: number = 0, lockToken: string = '', summary: string = '', operationId: string = '')
    {
        this._data = [ offerId, catalogMode, draftVersionId, expectedRevision, lockToken, summary, operationId ];
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
