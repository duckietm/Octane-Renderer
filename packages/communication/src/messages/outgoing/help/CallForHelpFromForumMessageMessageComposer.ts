import { IMessageComposer } from '@octane/api';

export class CallForHelpFromForumMessageMessageComposer implements IMessageComposer<ConstructorParameters<typeof CallForHelpFromForumMessageMessageComposer>>
{
    private _data: ConstructorParameters<typeof CallForHelpFromForumMessageMessageComposer>;

    constructor(groupId: number, threadId: number, messageId: number, cfhTopic: number, message: string)
    {
        this._data = [groupId, threadId, messageId, cfhTopic, message];
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
