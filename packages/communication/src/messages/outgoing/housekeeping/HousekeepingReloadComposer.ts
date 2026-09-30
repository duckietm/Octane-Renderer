import { IMessageComposer } from '@octane/api';

/** Hot reloads one hotel table (catalog, texts, permissions, ...) through its update command. */
export class HousekeepingReloadComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingReloadComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingReloadComposer>;

    constructor(target: string)
    {
        this._data = [target];
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
