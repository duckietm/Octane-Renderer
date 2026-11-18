class SpreadListComposerFixture
{
    private _data: unknown[];

    constructor(tags: string[])
    {
        this._data = [];
        this._data.push(tags.length, ...tags);
    }

    public getMessageArray()
    {
        return this._data;
    }
}
