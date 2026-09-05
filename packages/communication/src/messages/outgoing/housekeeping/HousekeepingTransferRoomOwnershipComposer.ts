import { IMessageComposer } from '@octane/api';

export class HousekeepingTransferRoomOwnershipComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingTransferRoomOwnershipComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingTransferRoomOwnershipComposer>;

    constructor(roomId: number, newOwnerId: number)
    {
        this._data = [roomId, newOwnerId];
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
