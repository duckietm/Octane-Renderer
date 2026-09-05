import { IMessageComposer } from '@octane/api';

export class SetRoomSessionTagsMessageComposer implements IMessageComposer<ConstructorParameters<typeof SetRoomSessionTagsMessageComposer>>
{
    private _data: ConstructorParameters<typeof SetRoomSessionTagsMessageComposer>;

    constructor(firstTag: string, secondTag: string)
    {
        this._data = [firstTag, secondTag];
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
