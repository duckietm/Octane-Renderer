import { IMessageComposer } from '@octane/api';

export class RequestMentionsComposer implements IMessageComposer<ConstructorParameters<typeof RequestMentionsComposer>>
{
    private _data: ConstructorParameters<typeof RequestMentionsComposer>;

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
