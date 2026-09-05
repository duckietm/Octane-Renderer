import { IMessageComposer } from '@octane/api';

export class RoomNetworkOpenConnectionMessageComposer implements IMessageComposer<ConstructorParameters<typeof RoomNetworkOpenConnectionMessageComposer>>
{
    private _data: ConstructorParameters<typeof RoomNetworkOpenConnectionMessageComposer>;

    constructor(roomId: number, instanceType: number)
    {
        this._data = [roomId, instanceType];
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
