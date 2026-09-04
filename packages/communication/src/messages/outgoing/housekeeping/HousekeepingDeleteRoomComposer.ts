import { IMessageComposer } from '@nitrots/api';

export class HousekeepingDeleteRoomComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingDeleteRoomComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingDeleteRoomComposer>;

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
