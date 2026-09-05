import { IMessageComposer } from '@octane/api';

export class HousekeepingSetUserRankComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingSetUserRankComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingSetUserRankComposer>;

    constructor(userId: number, rankId: number)
    {
        this._data = [userId, rankId];
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
