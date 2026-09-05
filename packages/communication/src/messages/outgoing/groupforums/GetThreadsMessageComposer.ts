import { IMessageComposer } from '@octane/api';

export class GetThreadsMessageComposer implements IMessageComposer<ConstructorParameters<typeof GetThreadsMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetThreadsMessageComposer>;

    constructor(groupId: number, startIndex: number, amount: number)
    {
        this._data = [groupId, startIndex, amount];
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
