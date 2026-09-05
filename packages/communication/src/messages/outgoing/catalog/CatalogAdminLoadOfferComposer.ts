import { IMessageComposer } from '@octane/api';

export class CatalogAdminLoadOfferComposer implements IMessageComposer<ConstructorParameters<typeof CatalogAdminLoadOfferComposer>>
{
    private _data: ConstructorParameters<typeof CatalogAdminLoadOfferComposer>;

    constructor(offerId: number, catalogMode: string = 'NORMAL', draftVersionId: number = 0, expectedRevision: number = 0)
    {
        this._data = [ offerId, catalogMode, draftVersionId, expectedRevision ];
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
