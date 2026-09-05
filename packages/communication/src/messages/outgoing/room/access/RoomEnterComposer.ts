import { IMessageComposer } from '@octane/api';

type RoomEnterPayload = [ number, string, number?, number? ];

export class RoomEnterComposer implements IMessageComposer<RoomEnterPayload>
{
    private _data: RoomEnterPayload;

    /**
     * Optional spawnX/spawnY let the server resume the avatar at a
     * specific tile when re-entering the same room — used by the
     * reconnect flow. Arcturus' RequestRoomLoadEvent reads both ints
     * only if `packet.remaining >= 8`, so omitting them keeps the
     * legacy enter-via-door behavior.
     */
    constructor(roomId: number, password: string = null, spawnX?: number, spawnY?: number)
    {
        this._data = (spawnX !== undefined && spawnY !== undefined)
            ? [ roomId, password, spawnX, spawnY ]
            : [ roomId, password ];
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
