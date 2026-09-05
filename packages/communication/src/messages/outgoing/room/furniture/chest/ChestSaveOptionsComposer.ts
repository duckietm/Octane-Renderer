import { IMessageComposer } from '@octane/api';

/**
 * The three switches on the chest window itself: [itemId, locked, autoLock, capacity].
 *
 * Sent the moment one of them is touched rather than behind a save button, because closing a chest
 * is something you do in the moment, next to the contents you are closing.
 */
export class ChestSaveOptionsComposer implements IMessageComposer<ConstructorParameters<typeof ChestSaveOptionsComposer>>
{
    private _data: ConstructorParameters<typeof ChestSaveOptionsComposer>;

    constructor(itemId: number, locked: boolean, autoLock: boolean, capacity: number)
    {
        this._data = [itemId, locked, autoLock, capacity];
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
