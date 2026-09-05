import { IMessageComposer } from '@octane/api';

export class HousekeepingRoomStateComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingRoomStateComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingRoomStateComposer>;

    constructor(roomId: number, open: boolean)
    {
        this._data = [roomId, open];
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
