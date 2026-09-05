import { IMessageComposer } from '@octane/api';

/**
 * Saves a wired chest's notification prefs. [itemId, full, donation, withdraw, empty, wired, mode].
 */
export class ChestSaveNotificationsComposer implements IMessageComposer<ConstructorParameters<typeof ChestSaveNotificationsComposer>>
{
    private _data: ConstructorParameters<typeof ChestSaveNotificationsComposer>;

    constructor(itemId: number, full: boolean, donation: boolean, withdraw: boolean, empty: boolean, wired: boolean, mode: number)
    {
        this._data = [itemId, full, donation, withdraw, empty, wired, mode];
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
