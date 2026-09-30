import { IMessageComposer } from '@octane/api';

/** Ends one ban by its id, leaving the user's other bans in force. */
export class HousekeepingRevokeBanComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingRevokeBanComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingRevokeBanComposer>;

    constructor(banId: number)
    {
        this._data = [banId];
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
