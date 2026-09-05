import { IMessageComposer } from '@octane/api';

export class Game2GetAccountGameStatusMessageComposer implements IMessageComposer<ConstructorParameters<typeof Game2GetAccountGameStatusMessageComposer>>
{
    private _data: ConstructorParameters<typeof Game2GetAccountGameStatusMessageComposer>;

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
