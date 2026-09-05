import { IMessageComposer } from '@octane/api';

/**
 * Requests one page of the wired chest transaction log. [amount, page, filter, chestId].
 *
 * Pages are 1-based. Filter is 0 = everything, 1 = only currency chests, 2 = only furni chests;
 * the server clamps anything else back to 0.
 *
 * chestId narrows the log to one chest, or zero for the whole room -- a room with a dozen chests
 * produces a log nobody can read, and this is how you ask about the one you care about.
 */
export class WiredChestRoomLogsComposer implements IMessageComposer<ConstructorParameters<typeof WiredChestRoomLogsComposer>>
{
    private _data: ConstructorParameters<typeof WiredChestRoomLogsComposer>;

    constructor(amount: number, page: number, filter: number, chestId: number = 0)
    {
        this._data = [amount, page, filter, chestId];
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
