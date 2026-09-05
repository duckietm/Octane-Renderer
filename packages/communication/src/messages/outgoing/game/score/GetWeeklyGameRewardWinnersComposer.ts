import { IMessageComposer } from '@octane/api';

export class GetWeeklyGameRewardWinnersComposer implements IMessageComposer<ConstructorParameters<typeof GetWeeklyGameRewardWinnersComposer>>
{
    private _data: ConstructorParameters<typeof GetWeeklyGameRewardWinnersComposer>;

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
