import { IMessageComposer } from '@octane/api';

export class GameUnloadedMessageComposer implements IMessageComposer<ConstructorParameters<typeof GameUnloadedMessageComposer>>
{
    private _data: ConstructorParameters<typeof GameUnloadedMessageComposer>;

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
