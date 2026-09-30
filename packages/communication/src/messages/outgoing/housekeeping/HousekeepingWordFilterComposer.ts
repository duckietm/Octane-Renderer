import { IMessageComposer } from '@octane/api';

/** Adds a word to the word filter (`add`, or changes its replacement) or removes one (`remove`). */
export class HousekeepingWordFilterComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingWordFilterComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingWordFilterComposer>;

    constructor(action: string, word: string, replacement: string)
    {
        this._data = [action, word, replacement];
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
