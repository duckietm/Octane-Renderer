import { IMessageComposer } from '@octane/api';

export class GetWeeklyGameRewardComposer implements IMessageComposer<ConstructorParameters<typeof GetWeeklyGameRewardComposer>>
{
    private _data: ConstructorParameters<typeof GetWeeklyGameRewardComposer>;

    constructor(gameTypeId: number)
    {
        this._data = [ gameTypeId ];
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
