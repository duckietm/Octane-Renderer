import { IMessageComposer } from '@octane/api';

export class RoomTextSearchMessageComposer implements IMessageComposer<ConstructorParameters<typeof RoomTextSearchMessageComposer>>
{
    private _data: ConstructorParameters<typeof RoomTextSearchMessageComposer>;

    constructor(query: string)
    {
        this._data = [query];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
