import { IMessageComposer } from '@octane/api';

export class SetActiveNickIconComposer implements IMessageComposer<ConstructorParameters<typeof SetActiveNickIconComposer>>
{
    private _data: ConstructorParameters<typeof SetActiveNickIconComposer>;

    constructor(iconId: number)
    {
        this._data = [ iconId ];
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
