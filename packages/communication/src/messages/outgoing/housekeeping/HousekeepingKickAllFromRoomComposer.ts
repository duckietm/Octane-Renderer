import { IMessageComposer } from '@nitrots/api';

export class HousekeepingKickAllFromRoomComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingKickAllFromRoomComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingKickAllFromRoomComposer>;

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
