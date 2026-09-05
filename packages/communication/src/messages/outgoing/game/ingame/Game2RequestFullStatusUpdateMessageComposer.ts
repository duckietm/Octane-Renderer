import { IMessageComposer } from '@octane/api';

export class Game2RequestFullStatusUpdateMessageComposer implements IMessageComposer<ConstructorParameters<typeof Game2RequestFullStatusUpdateMessageComposer>>
{
    private _data: ConstructorParameters<typeof Game2RequestFullStatusUpdateMessageComposer>;

    constructor(syncCount: number)
    {
        this._data = [ syncCount ];
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
