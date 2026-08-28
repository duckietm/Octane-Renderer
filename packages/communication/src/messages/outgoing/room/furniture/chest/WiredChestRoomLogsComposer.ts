import { IMessageComposer } from '@nitrots/api';

/**
 * Requests one page of the room-wide wired chest transaction log. [amount, page, filter].
 *
 * Pages are 1-based. Filter is 0 = everything, 1 = only currency chests, 2 = only furni chests;
 * the server clamps anything else back to 0.
 */
export class WiredChestRoomLogsComposer implements IMessageComposer<ConstructorParameters<typeof WiredChestRoomLogsComposer>>
{
    private _data: ConstructorParameters<typeof WiredChestRoomLogsComposer>;

    constructor(amount: number, page: number, filter: number)
    {
        this._data = [amount, page, filter];
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
