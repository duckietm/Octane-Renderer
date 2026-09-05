import { IMessageComposer } from '@octane/api';

export class CatalogAdminSaveOfferComposer implements IMessageComposer<ConstructorParameters<typeof CatalogAdminSaveOfferComposer>>
{
    private _data: ConstructorParameters<typeof CatalogAdminSaveOfferComposer>;

    constructor(offerId: number, pageId: number, itemIds: string, catalogName: string, costCredits: number, costPoints: number, pointsType: number, amount: number, clubOnly: number, extradata: string, haveOffer: boolean, offerIdGroup: number, limitedStack: number, orderNumber: number, songId: number = 0, catalogMode: string = 'NORMAL', draftVersionId: number = 0, expectedRevision: number = 0, lockToken: string = '', summary: string = '', operationId: string = '')
    {
        this._data = [ offerId, pageId, itemIds, catalogName, costCredits, costPoints, pointsType, amount, clubOnly, extradata, haveOffer, offerIdGroup, limitedStack, orderNumber, songId, catalogMode, draftVersionId, expectedRevision, lockToken, summary, operationId ];
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
