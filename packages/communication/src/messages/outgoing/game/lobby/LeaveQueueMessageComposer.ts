import { IMessageComposer } from '@octane/api';

export class LeaveQueueMessageComposer implements IMessageComposer<ConstructorParameters<typeof LeaveQueueMessageComposer>>
{
    private _data: ConstructorParameters<typeof LeaveQueueMessageComposer>;

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
