import { IMessageComposer } from '@octane/api';

export class HousekeepingSendHotelAlertComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingSendHotelAlertComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingSendHotelAlertComposer>;

    // recipient narrows the alert: "staff", "user:<name>" or "room:<id>". Left out, it goes to
    // the whole hotel; a server that reads only the message ignores it.
    constructor(message: string, recipient?: string)
    {
        this._data = [message];

        if(recipient !== undefined) this._data.push(recipient);
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
