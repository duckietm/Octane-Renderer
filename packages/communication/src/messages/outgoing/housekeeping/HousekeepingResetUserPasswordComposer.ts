import { IMessageComposer } from '@octane/api';

export class HousekeepingResetUserPasswordComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingResetUserPasswordComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingResetUserPasswordComposer>;

    constructor(userId: number)
    {
        this._data = [userId];
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
