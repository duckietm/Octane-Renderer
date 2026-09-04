import { IMessageComposer } from '@nitrots/api';

export class HousekeepingListActionLogComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingListActionLogComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingListActionLogComposer>;

    constructor(limit: number)
    {
        this._data = [limit];
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
