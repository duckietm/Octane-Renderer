import { IMessageComposer } from '@octane/api';

export class HousekeepingFindUserByNameComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingFindUserByNameComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingFindUserByNameComposer>;

    constructor(username: string)
    {
        this._data = [username];
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
