import { IMessageComposer } from '@octane/api';

/**
 * Requests a wired chest's transaction log. [itemId].
 */
export class ChestRequestLogComposer implements IMessageComposer<ConstructorParameters<typeof ChestRequestLogComposer>>
{
    private _data: ConstructorParameters<typeof ChestRequestLogComposer>;

    constructor(itemId: number)
    {
        this._data = [itemId];
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
