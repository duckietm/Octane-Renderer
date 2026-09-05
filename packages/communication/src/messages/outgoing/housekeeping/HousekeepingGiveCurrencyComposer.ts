import { IMessageComposer } from '@octane/api';

export class HousekeepingGiveCurrencyComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingGiveCurrencyComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingGiveCurrencyComposer>;

    constructor(userId: number, currencyType: number, amount: number)
    {
        this._data = [userId, currencyType, amount];
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
