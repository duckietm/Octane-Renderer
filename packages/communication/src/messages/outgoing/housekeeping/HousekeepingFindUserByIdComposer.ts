import { IMessageComposer } from '@octane/api';

export class HousekeepingFindUserByIdComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingFindUserByIdComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingFindUserByIdComposer>;

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
