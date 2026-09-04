import { IMessageComposer } from '@nitrots/api';

export class SnowWarGetWeeklyFriendsLeaderboardComposer implements IMessageComposer<ConstructorParameters<typeof SnowWarGetWeeklyFriendsLeaderboardComposer>>
{
    private _data: ConstructorParameters<typeof SnowWarGetWeeklyFriendsLeaderboardComposer>;

    constructor(gameTypeId: number, weekOffset: number, startRank: number, direction: number, viewSize: number, windowSize: number)
    {
        this._data = [ gameTypeId, weekOffset, startRank, direction, viewSize, windowSize ];
    }

    public getMessageArray()
    {
        return this._data;
    }
    public dispose(): void
    {
        this._data = null;
    }
}
