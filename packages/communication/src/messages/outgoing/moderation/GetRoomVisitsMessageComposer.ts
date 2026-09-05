import { IMessageComposer } from '@octane/api';

export class GetRoomVisitsMessageComposer implements IMessageComposer<ConstructorParameters<typeof GetRoomVisitsMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetRoomVisitsMessageComposer>;

    constructor(userId: number)
    {
        this._data = [userId];
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
