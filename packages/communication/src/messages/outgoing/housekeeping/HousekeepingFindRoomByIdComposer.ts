import { IMessageComposer } from '@nitrots/api';

export class HousekeepingFindRoomByIdComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingFindRoomByIdComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingFindRoomByIdComposer>;

    constructor(roomId: number)
    {
        this._data = [roomId];
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
