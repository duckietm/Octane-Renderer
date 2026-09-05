import { IMessageComposer } from '@octane/api';

export class SnowWarGetWeeklyLeaderboardComposer implements IMessageComposer<ConstructorParameters<typeof SnowWarGetWeeklyLeaderboardComposer>>
{
    private _data: ConstructorParameters<typeof SnowWarGetWeeklyLeaderboardComposer>;

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
