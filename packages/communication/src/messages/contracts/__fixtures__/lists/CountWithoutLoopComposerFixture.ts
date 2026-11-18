class CountWithoutLoopComposerFixture
{
    private _data: unknown[];

    constructor(ids: number[], name: string)
    {
        this._data = [ ids.length ];
        this._data.push(name);
    }

    public getMessageArray()
    {
        return this._data;
    }
}
