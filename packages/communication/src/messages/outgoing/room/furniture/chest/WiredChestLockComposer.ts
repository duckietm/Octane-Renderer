import { IMessageComposer } from '@octane/api';

/**
 * Locks or unlocks the room's wired chests. [lock, all].
 *
 * With all = false the server touches only the chests this user owns, which needs room rights;
 * with all = true it touches every chest in the room, which is the room owner's call.
 */
export class WiredChestLockComposer implements IMessageComposer<ConstructorParameters<typeof WiredChestLockComposer>>
{
    private _data: ConstructorParameters<typeof WiredChestLockComposer>;

    constructor(lock: boolean, all: boolean)
    {
        this._data = [lock, all];
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
