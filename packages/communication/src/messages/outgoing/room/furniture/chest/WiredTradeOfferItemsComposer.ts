import { IMessageComposer } from '@nitrots/api';

/**
 * Puts items on the negotiation table, or takes them off. [remove, count, itemId...].
 *
 * Item ids come in as a rest argument, the way the friend-list composers take theirs, so the count
 * and the list can never disagree about how many there are.
 *
 * The flag is `remove`, not `add`: false puts items down, true picks them back up. Only meaningful
 * while the table is still open for changes -- the server refuses it in any other state, which is
 * what stops anything being slipped in under an acceptance.
 */
export class WiredTradeOfferItemsComposer implements IMessageComposer<ConstructorParameters<typeof WiredTradeOfferItemsComposer>>
{
    private _data: ConstructorParameters<typeof WiredTradeOfferItemsComposer>;

    constructor(remove: boolean, ...itemIds: number[])
    {
        this._data = [remove, itemIds.length, ...itemIds];
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
