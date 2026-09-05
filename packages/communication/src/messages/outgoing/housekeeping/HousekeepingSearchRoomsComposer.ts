import { IMessageComposer } from '@octane/api';

export class HousekeepingSearchRoomsComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingSearchRoomsComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingSearchRoomsComposer>;

    constructor(query: string, exactMatch: boolean, limit: number)
    {
        this._data = [query, exactMatch, limit];
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
