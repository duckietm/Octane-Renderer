import { IMessageComposer } from '@octane/api';

export class RequestProfileAchievementsComposer implements IMessageComposer<ConstructorParameters<typeof RequestProfileAchievementsComposer>>
{
    private _data: ConstructorParameters<typeof RequestProfileAchievementsComposer>;

    constructor(userId: number)
    {
        this._data = [ userId ];
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
