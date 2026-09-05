import { IMessageComposer } from '@octane/api';

export class BuildersClubPlaceWallItemMessageComposer implements IMessageComposer<ConstructorParameters<typeof BuildersClubPlaceWallItemMessageComposer>>
{
    private _data: ConstructorParameters<typeof BuildersClubPlaceWallItemMessageComposer>;

    constructor(pageId: number, offerId: number, extraParam: string, location: string)
    {
        this._data = [pageId, offerId, extraParam, location];
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
