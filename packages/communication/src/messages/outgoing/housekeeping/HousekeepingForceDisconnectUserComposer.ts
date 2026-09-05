import { IMessageComposer } from '@octane/api';

export class HousekeepingForceDisconnectUserComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingForceDisconnectUserComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingForceDisconnectUserComposer>;

    constructor(userId: number, reason: string)
    {
        this._data = [userId, reason];
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
