import { IMessageComposer } from '@octane/api';

/** Walk away from a negotiation. Carries nothing; everything on the table goes back. */
export class WiredTradeCancelComposer implements IMessageComposer<ConstructorParameters<typeof WiredTradeCancelComposer>>
{
    private _data: ConstructorParameters<typeof WiredTradeCancelComposer>;

    constructor()
    {
        this._data = [];
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
