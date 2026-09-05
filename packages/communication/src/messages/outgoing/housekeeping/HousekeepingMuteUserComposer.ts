import { IMessageComposer } from '@octane/api';

export class HousekeepingMuteUserComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingMuteUserComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingMuteUserComposer>;

    constructor(userId: number, reason: string, minutes: number)
    {
        this._data = [userId, reason, minutes];
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
