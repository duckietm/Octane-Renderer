import { IMessageComposer } from '@octane/api';

/**
 * The chest window was closed: [itemId].
 *
 * A chest set to open while someone is looking inside has to be told when they stopped -- only the
 * client knows that, so it says so, and the lid comes back down for everyone in the room.
 */
export class ChestCloseComposer implements IMessageComposer<ConstructorParameters<typeof ChestCloseComposer>>
{
    private _data: ConstructorParameters<typeof ChestCloseComposer>;

    constructor(itemId: number)
    {
        this._data = [itemId];
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
