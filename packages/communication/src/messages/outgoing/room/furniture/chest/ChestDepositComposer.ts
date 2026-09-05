import { IMessageComposer } from '@octane/api';

/**
 * Player deposits currency into a wired chest (Scrigno). [itemId, currencyType, amount].
 * currencyType: -1 = credits, >= 0 = points type.
 */
export class ChestDepositComposer implements IMessageComposer<ConstructorParameters<typeof ChestDepositComposer>>
{
    private _data: ConstructorParameters<typeof ChestDepositComposer>;

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
