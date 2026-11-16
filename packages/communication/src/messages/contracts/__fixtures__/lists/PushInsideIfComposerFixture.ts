class PushInsideIfComposerFixture
{
    private _data: unknown[];

    constructor(ids: number[])
    {
        this._data = [ ids.length ];
        for(const id of ids)
        {
            if(id > 0) this._data.push(id);
        }
    }

    public getMessageArray()
    {
        return this._data;
    }
}
