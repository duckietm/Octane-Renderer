import { IMessageComposer } from '@nitrots/api';

export class SnowWarGetAllTimeFriendsLeaderboardComposer implements IMessageComposer<ConstructorParameters<typeof SnowWarGetAllTimeFriendsLeaderboardComposer>>
{
    private _data: ConstructorParameters<typeof SnowWarGetAllTimeFriendsLeaderboardComposer>;

    constructor(gameTypeId: number, startRank: number, direction: number, viewSize: number, windowSize: number)
    {
        this._data = [ gameTypeId, startRank, direction, viewSize, windowSize ];
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
