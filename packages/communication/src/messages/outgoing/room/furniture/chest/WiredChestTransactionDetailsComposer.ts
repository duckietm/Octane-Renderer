import { IMessageComposer } from '@nitrots/api';

/**
 * Requests the furni breakdown of one logged chest transaction. [transactionId].
 */
export class WiredChestTransactionDetailsComposer implements IMessageComposer<ConstructorParameters<typeof WiredChestTransactionDetailsComposer>>
{
    private _data: ConstructorParameters<typeof WiredChestTransactionDetailsComposer>;

    constructor(transactionId: number)
    {
        this._data = [transactionId];
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
