import { IMessageComposer } from '@octane/api';

export class Game2GetWeeklyLeaderboardComposer implements IMessageComposer<ConstructorParameters<typeof Game2GetWeeklyLeaderboardComposer>>
{
    private _data: ConstructorParameters<typeof Game2GetWeeklyLeaderboardComposer>;

    constructor(gameTypeId:number, offset:number, value3:number, value4:number, value5:number, value6:number)
    {
        this._data = [ gameTypeId, offset, value3, value4, value5, value6 ];
    }

    dispose(): void
    {
        this._data = null;
    }

    public getMessageArray()
    {
        return this._data;
    }
}
