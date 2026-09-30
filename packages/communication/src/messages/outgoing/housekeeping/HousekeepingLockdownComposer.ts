import { IMessageComposer } from '@octane/api';

/** Switches the emergency lockdown of the panel; only the highest rank may. */
export class HousekeepingLockdownComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingLockdownComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingLockdownComposer>;

    constructor(enabled: boolean)
    {
        this._data = [enabled];
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
