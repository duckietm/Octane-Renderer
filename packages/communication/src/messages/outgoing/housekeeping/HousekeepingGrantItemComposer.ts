import { IMessageComposer } from '@octane/api';

export class HousekeepingGrantItemComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingGrantItemComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingGrantItemComposer>;

    constructor(userId: number, itemId: number, quantity: number)
    {
        this._data = [userId, itemId, quantity];
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
