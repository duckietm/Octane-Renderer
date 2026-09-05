import { IMessageComposer } from '@octane/api';

export class HousekeepingKickUserComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingKickUserComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingKickUserComposer>;

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
