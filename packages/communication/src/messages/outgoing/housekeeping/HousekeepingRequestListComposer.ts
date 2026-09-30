import { IMessageComposer } from '@octane/api';

/** Asks for one housekeeping list (user.chatlog, room.visits, ...) of a user or a room. */
export class HousekeepingRequestListComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingRequestListComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingRequestListComposer>;

    // reveal = 1 asks for IP addresses in clear (acc_hk_view_private, audited). Left out, they come
    // masked; a server that reads two fields ignores it.
    constructor(listKey: string, targetId: number, reveal?: number)
    {
        this._data = [listKey, targetId];

        if(reveal !== undefined) this._data.push(reveal);
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
