class LiteralSpreadComposerFixture
{
    private _data: unknown[];

    constructor(roomId: number, ids: number[], retry: boolean)
    {
        this._data = [ roomId, ids.length, ...ids, retry ];
    }

    public getMessageArray()
    {
        return this._data;
    }
}
