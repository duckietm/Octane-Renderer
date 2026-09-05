import { IMessageComposer } from '@octane/api';

export class RequestOfflineMessagesComposer implements IMessageComposer<ConstructorParameters<typeof RequestOfflineMessagesComposer>>
{
    private _data: ConstructorParameters<typeof RequestOfflineMessagesComposer>;

    constructor()
    {
        this._data = [];
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
