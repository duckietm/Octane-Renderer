import { IMessageComposer } from '@octane/api';

export class GetThreadMessageComposer implements IMessageComposer<ConstructorParameters<typeof GetThreadMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetThreadMessageComposer>;

    constructor(groupId: number, threadId: number)
    {
        this._data = [groupId, threadId];
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
