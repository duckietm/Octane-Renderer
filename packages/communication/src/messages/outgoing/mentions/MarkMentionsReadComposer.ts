import { IMessageComposer } from '@octane/api';

export class MarkMentionsReadComposer implements IMessageComposer<ConstructorParameters<typeof MarkMentionsReadComposer>>
{
    private _data: ConstructorParameters<typeof MarkMentionsReadComposer>;

    constructor(mode: number, mentionId: number = 0)
    {
        this._data = [mode, mentionId];
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
