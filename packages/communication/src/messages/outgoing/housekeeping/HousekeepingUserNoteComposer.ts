import { IMessageComposer } from '@octane/api';

/** Adds a staff note to a user (`add`, with the text) or deletes one of the operator's own notes (`delete`, with its id). */
export class HousekeepingUserNoteComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingUserNoteComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingUserNoteComposer>;

    constructor(action: string, userId: number, noteId: number, note: string)
    {
        this._data = [action, userId, noteId, note];
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
