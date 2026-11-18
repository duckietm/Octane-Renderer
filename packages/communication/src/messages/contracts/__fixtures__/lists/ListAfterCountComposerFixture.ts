interface ListFixtureOrder
{
    id: number;
    orderNumber: number;
}

class ListAfterCountComposerFixture
{
    private _data: unknown[];

    constructor(orders: ListFixtureOrder[], catalogMode: string = 'NORMAL', draftVersionId: number = 0, expectedRevision: number = 0, lockToken: string = '', summary: string = '', operationId: string = '')
    {
        this._data = [ orders.length ];
        for(const order of orders) this._data.push(order.id, order.orderNumber);
        this._data.push(catalogMode, draftVersionId, expectedRevision, lockToken, summary, operationId);
    }

    public getMessageArray()
    {
        return this._data;
    }
}
