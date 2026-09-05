import { IMessageComposer } from '@octane/api';

/** Start furni deposit mode (official Kigike / header 3514 wire shape, Octane header 9324). */
export class ChestStartDepositComposer implements IMessageComposer<ConstructorParameters<typeof ChestStartDepositComposer>>
{
    private _data: ConstructorParameters<typeof ChestStartDepositComposer>;

    constructor(chestItemId: number)
    {
        this._data = [chestItemId];
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
