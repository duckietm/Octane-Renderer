import { IMessageComposer } from '@octane/api';

export class GetIsUserPartOfCompetitionMessageComposer implements IMessageComposer<ConstructorParameters<typeof GetIsUserPartOfCompetitionMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetIsUserPartOfCompetitionMessageComposer>;

    constructor(goalCode: string)
    {
        this._data = [goalCode];
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
