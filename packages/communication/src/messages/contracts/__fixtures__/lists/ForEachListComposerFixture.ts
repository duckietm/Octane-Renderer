class ForEachListComposerFixture
{
    private _data: unknown[];

    constructor(...data: ListFixtureReadMarker[])
    {
        this._data = [data.length];
        data.forEach(entry =>
        {
            this._data.push(entry.groupId);
            this._data.push(entry.messageId);
            this._data.push(entry.read);
        });
    }

    public getMessageArray()
    {
        return this._data;
    }
}

class ListFixtureReadMarker
{
    constructor(public groupId: number, public messageId: number, public read: boolean)
    { }
}
