import { IMessageComposer } from '@octane/api';

/**
 * Player deposits floor furni from inventory into a wired furni chest (Scrigno furni).
 * [itemId, baseItemId, amount]
 */
export class ChestDepositFurniComposer implements IMessageComposer<ConstructorParameters<typeof ChestDepositFurniComposer>>
{
    private _data: ConstructorParameters<typeof ChestDepositFurniComposer>;

    constructor(itemId: number, baseItemId: number, amount: number)
    {
        this._data = [itemId, baseItemId, amount];
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
