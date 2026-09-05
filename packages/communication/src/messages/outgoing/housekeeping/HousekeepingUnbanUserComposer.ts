import { IMessageComposer } from '@octane/api';

export class HousekeepingUnbanUserComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingUnbanUserComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingUnbanUserComposer>;

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
