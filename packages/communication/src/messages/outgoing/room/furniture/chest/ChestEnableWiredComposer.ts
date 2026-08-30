import { IMessageComposer } from '@nitrots/api';

/**
 * Make a chest answer wired: [itemId].
 *
 * One way only. A room built around a chest would break the moment somebody switched it back off,
 * which is why the window asks first and why there is no message to undo it.
 */
export class ChestEnableWiredComposer implements IMessageComposer<ConstructorParameters<typeof ChestEnableWiredComposer>>
{
    private _data: ConstructorParameters<typeof ChestEnableWiredComposer>;

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
