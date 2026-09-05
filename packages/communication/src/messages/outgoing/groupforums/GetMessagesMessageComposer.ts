import { IMessageComposer } from '@octane/api';

export class GetMessagesMessageComposer implements IMessageComposer<ConstructorParameters<typeof GetMessagesMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetMessagesMessageComposer>;

    constructor(groupId: number, threadId: number, startIndex: number, amount: number)
    {
        this._data = [groupId, threadId, startIndex, amount];
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
