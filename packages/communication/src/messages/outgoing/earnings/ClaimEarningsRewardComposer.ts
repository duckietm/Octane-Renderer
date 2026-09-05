import { IMessageComposer } from '@octane/api';

export class ClaimEarningsRewardComposer implements IMessageComposer<ConstructorParameters<typeof ClaimEarningsRewardComposer>>
{
    private _data: ConstructorParameters<typeof ClaimEarningsRewardComposer>;

    constructor(categoryKey: string)
    {
        this._data = [categoryKey];
    }

    public dispose(): void
    {
        this._data = null;
    }

    public getMessageArray()
    {
        return this._data;
    }
}
