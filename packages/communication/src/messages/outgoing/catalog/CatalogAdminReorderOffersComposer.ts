import { IMessageComposer } from '@octane/api';

export interface ICatalogAdminOfferOrder
{
    id: number;
    orderNumber: number;
}

export class CatalogAdminReorderOffersComposer implements IMessageComposer<any[]>
{
    private _data: any[];

    constructor(orders: ICatalogAdminOfferOrder[], catalogMode: string = 'NORMAL', draftVersionId: number = 0, expectedRevision: number = 0, lockToken: string = '', summary: string = '', operationId: string = '')
    {
        this._data = [ orders.length ];
        for(const order of orders) this._data.push(order.id, order.orderNumber);
        this._data.push(catalogMode, draftVersionId, expectedRevision, lockToken, summary, operationId);
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
