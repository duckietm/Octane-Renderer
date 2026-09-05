import { IMessageComposer } from '@octane/api';

export class RoomAdSearchMessageComposer implements IMessageComposer<ConstructorParameters<typeof RoomAdSearchMessageComposer>>
{
    private _data: ConstructorParameters<typeof RoomAdSearchMessageComposer>;

    constructor(adIndex: number, tabId: number)
    {
        this._data = [adIndex, tabId];
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
