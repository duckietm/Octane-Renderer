import { IMessageComposer } from '@octane/api';

/**
 * Maintenance from the panel: `status` reads it, `start` begins a countdown of `minutes`
 * (0 closes at once) with an optional message, `cancel` stops the countdown and `disable`
 * switches maintenance off. The server answers with HousekeepingMaintenanceStatusEvent.
 */
export class HousekeepingMaintenanceComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingMaintenanceComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingMaintenanceComposer>;

    constructor(action: string, message: string, minutes: number)
    {
        this._data = [action, message, minutes];
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
