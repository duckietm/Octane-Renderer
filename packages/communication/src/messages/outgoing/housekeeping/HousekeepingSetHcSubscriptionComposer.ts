import { IMessageComposer } from '@octane/api';

export class HousekeepingSetHcSubscriptionComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingSetHcSubscriptionComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingSetHcSubscriptionComposer>;

    constructor(userId: number, days: number)
    {
        this._data = [userId, days];
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
