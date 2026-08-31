import { IMessageComposer } from '@nitrots/api';

/**
 * Both halves of agreeing, told apart by one flag. [confirm].
 *
 * false is the first press: the player agrees and a short countdown starts, but nothing has changed
 * hands. true is the second, after the countdown, and that one settles. The split is what gives a
 * player the moment to notice an offer that moved under them.
 */
export class WiredTradeAcceptComposer implements IMessageComposer<ConstructorParameters<typeof WiredTradeAcceptComposer>>
{
    private _data: ConstructorParameters<typeof WiredTradeAcceptComposer>;

    constructor(confirm: boolean)
    {
        this._data = [confirm];
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
