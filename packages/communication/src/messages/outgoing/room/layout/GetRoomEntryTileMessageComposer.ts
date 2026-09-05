import { IMessageComposer } from '@octane/api';

export class GetRoomEntryTileMessageComposer implements IMessageComposer<ConstructorParameters<typeof GetRoomEntryTileMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetRoomEntryTileMessageComposer>;

    constructor()
    {
        this._data = [];
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
