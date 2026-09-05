import { IMessageComposer } from '@octane/api';

export class HousekeepingMuteRoomComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingMuteRoomComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingMuteRoomComposer>;

    constructor(roomId: number, minutes: number)
    {
        this._data = [roomId, minutes];
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
