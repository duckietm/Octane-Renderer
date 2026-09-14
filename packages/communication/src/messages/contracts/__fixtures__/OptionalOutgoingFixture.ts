export class OptionalOutgoingFixture
{
    private _data: [number, string?];
    constructor(id: number, variableToken?: string)
    {
        this._data = [id];
        if(variableToken !== undefined) this._data.push(variableToken);
    }
    public getMessageArray() { return this._data; }
}
