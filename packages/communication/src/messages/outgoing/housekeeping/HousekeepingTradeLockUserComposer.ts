import { IMessageComposer } from '@octane/api';

export class HousekeepingTradeLockUserComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingTradeLockUserComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingTradeLockUserComposer>;

    constructor(userId: number, hours: number, reason: string)
    {
        this._data = [userId, hours, reason];
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
