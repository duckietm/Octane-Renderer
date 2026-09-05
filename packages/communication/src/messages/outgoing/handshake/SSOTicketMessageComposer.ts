import { IMessageComposer } from '@octane/api';

export class SSOTicketMessageComposer implements IMessageComposer<ConstructorParameters<typeof SSOTicketMessageComposer>>
{
    private _data: ConstructorParameters<typeof SSOTicketMessageComposer>;

    constructor(ticket: string, time: number, recoveryToken: string = '')
    {
        this._data = [ ticket, time, recoveryToken ];
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
