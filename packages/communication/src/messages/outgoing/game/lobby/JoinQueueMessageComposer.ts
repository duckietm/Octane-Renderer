import { IMessageComposer } from '@octane/api';

export class JoinQueueMessageComposer implements IMessageComposer<ConstructorParameters<typeof JoinQueueMessageComposer>>
{
    private _data: ConstructorParameters<typeof JoinQueueMessageComposer>;

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
