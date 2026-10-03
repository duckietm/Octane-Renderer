import { IMessageComposer } from '@octane/api';

export class HousekeepingSetUserRankComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingSetUserRankComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingSetUserRankComposer>;

    // durationSeconds makes the rank temporary: after it the user gets their previous rank back.
    // Left out (or 0) the rank lasts; a server that reads two ints ignores it.
    constructor(userId: number, rankId: number, durationSeconds?: number)
    {
        this._data = [userId, rankId];

        if(durationSeconds !== undefined) this._data.push(durationSeconds);
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
