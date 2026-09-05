import { IMessageComposer } from '@octane/api';

export class RequestNickIconsComposer implements IMessageComposer<ConstructorParameters<typeof RequestNickIconsComposer>>
{
    private _data: ConstructorParameters<typeof RequestNickIconsComposer>;

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
