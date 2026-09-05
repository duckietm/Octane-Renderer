import { IMessageComposer } from '@octane/api';

export class GetGameStatusMessageComposer implements IMessageComposer<ConstructorParameters<typeof GetGameStatusMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetGameStatusMessageComposer>;

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
