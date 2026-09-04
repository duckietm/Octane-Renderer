import { IMessageComposer } from '@nitrots/api';

export class HousekeepingGiveCreditsComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingGiveCreditsComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingGiveCreditsComposer>;

    constructor(userId: number, amount: number)
    {
        this._data = [userId, amount];
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
