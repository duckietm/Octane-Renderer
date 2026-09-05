import { IMessageComposer } from '@octane/api';

/**
 * Player withdraws currency from a wired chest (Scrigno). [itemId, currencyType, amount].
 * amount < 0 = withdraw all of that currency type. currencyType: -1 = credits, >= 0 = points type.
 */
export class ChestWithdrawComposer implements IMessageComposer<ConstructorParameters<typeof ChestWithdrawComposer>>
{
    private _data: ConstructorParameters<typeof ChestWithdrawComposer>;

    constructor(itemId: number, currencyType: number, amount: number)
    {
        this._data = [itemId, currencyType, amount];
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
