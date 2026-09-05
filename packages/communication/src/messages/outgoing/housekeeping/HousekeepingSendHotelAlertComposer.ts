import { IMessageComposer } from '@octane/api';

export class HousekeepingSendHotelAlertComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingSendHotelAlertComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingSendHotelAlertComposer>;

    constructor(message: string)
    {
        this._data = [message];
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
