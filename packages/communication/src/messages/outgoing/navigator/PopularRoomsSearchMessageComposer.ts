import { IMessageComposer } from '@octane/api';

export class PopularRoomsSearchMessageComposer implements IMessageComposer<ConstructorParameters<typeof PopularRoomsSearchMessageComposer>>
{
    private _data: ConstructorParameters<typeof PopularRoomsSearchMessageComposer>;

    constructor(query: string, adIndex: number)
    {
        this._data = [query, adIndex];
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
