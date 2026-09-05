import { IMessageComposer } from '@octane/api';

export class GetUserGameAchievementsMessageComposer implements IMessageComposer<ConstructorParameters<typeof GetUserGameAchievementsMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetUserGameAchievementsMessageComposer>;

    constructor(userId: number)
    {
        this._data = [ userId ];
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
