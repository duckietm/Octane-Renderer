import { IMessageComposer } from '@octane/api';

export class UseHabbiconComposer implements IMessageComposer<ConstructorParameters<typeof UseHabbiconComposer>>
{
    private _data: ConstructorParameters<typeof UseHabbiconComposer>;

    constructor(habbiconId: number)
    {
        this._data = [habbiconId];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        this._data = null;
    }
}
