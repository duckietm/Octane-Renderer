import { IMessageComposer } from '@octane/api';

export class ResetResolutionAchievementMessageComposer implements IMessageComposer<ConstructorParameters<typeof ResetResolutionAchievementMessageComposer>>
{
    private _data: ConstructorParameters<typeof ResetResolutionAchievementMessageComposer>;

    constructor(achievementId: number)
    {
        this._data = [ achievementId ];
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
