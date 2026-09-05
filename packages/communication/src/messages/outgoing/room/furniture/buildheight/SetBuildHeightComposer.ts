import { IMessageComposer } from '@octane/api';

export class SetBuildHeightComposer implements IMessageComposer<ConstructorParameters<typeof SetBuildHeightComposer>>
{
    private _data: ConstructorParameters<typeof SetBuildHeightComposer>;

    constructor(enabled: boolean, heightHundredths: number)
    {
        this._data = [enabled, heightHundredths];
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
