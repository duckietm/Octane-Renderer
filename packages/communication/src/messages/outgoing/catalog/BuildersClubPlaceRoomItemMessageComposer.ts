import { IMessageComposer } from '@octane/api';

export class BuildersClubPlaceRoomItemMessageComposer implements IMessageComposer<ConstructorParameters<typeof BuildersClubPlaceRoomItemMessageComposer>>
{
    private _data: ConstructorParameters<typeof BuildersClubPlaceRoomItemMessageComposer>;

    constructor(pageId: number, offerId: number, extraParam: string, x: number, y: number, direction: number)
    {
        this._data = [pageId, offerId, extraParam, x, y, direction];
    }

    dispose(): void
    {
        this._data = null;
    }

    public getMessageArray()
    {
        return this._data;
    }
}
