import { IMessageComposer } from '@octane/api';

export class Game2LoadStageReadyMessageComposer implements IMessageComposer<ConstructorParameters<typeof Game2LoadStageReadyMessageComposer>>
{
    private _data: ConstructorParameters<typeof Game2LoadStageReadyMessageComposer>;

    constructor(gameId: number)
    {
        this._data = [ gameId ];
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
