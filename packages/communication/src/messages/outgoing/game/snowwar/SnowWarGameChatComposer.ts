import { IMessageComposer } from '@octane/api';

export class SnowWarGameChatComposer implements IMessageComposer<ConstructorParameters<typeof SnowWarGameChatComposer>>
{
    private _data: ConstructorParameters<typeof SnowWarGameChatComposer>;

    constructor(message: string)
    {
        this._data = [ message ];
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
