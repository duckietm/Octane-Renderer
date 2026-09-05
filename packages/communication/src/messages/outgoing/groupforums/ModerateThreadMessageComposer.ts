import { IMessageComposer } from '@octane/api';

export class ModerateThreadMessageComposer implements IMessageComposer<ConstructorParameters<typeof ModerateThreadMessageComposer>>
{
    private _data: ConstructorParameters<typeof ModerateThreadMessageComposer>;

    constructor(groupId: number, threadId: number, state: number)
    {
        this._data = [groupId, threadId, state];
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
