import { IMessageComposer } from '@octane/api';

export class RemoveJukeboxDiskComposer implements IMessageComposer<ConstructorParameters<typeof RemoveJukeboxDiskComposer>>
{
    private _data: ConstructorParameters<typeof RemoveJukeboxDiskComposer>;

    constructor(slotNumber: number)
    {
        this._data = [slotNumber];
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
