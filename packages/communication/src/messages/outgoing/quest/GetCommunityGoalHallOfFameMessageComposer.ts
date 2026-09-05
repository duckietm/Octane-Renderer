import { IMessageComposer } from '@octane/api';

export class GetCommunityGoalHallOfFameMessageComposer implements IMessageComposer<ConstructorParameters<typeof GetCommunityGoalHallOfFameMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetCommunityGoalHallOfFameMessageComposer>;

    constructor(questCode: string)
    {
        this._data = [questCode];
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
