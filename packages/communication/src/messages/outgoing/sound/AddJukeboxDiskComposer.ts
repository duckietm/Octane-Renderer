import { IMessageComposer } from '@octane/api';

export class AddJukeboxDiskComposer implements IMessageComposer<ConstructorParameters<typeof AddJukeboxDiskComposer>>
{
    private _data: ConstructorParameters<typeof AddJukeboxDiskComposer>;

    constructor(slotNumber: number, diskId: number)
    {
        this._data = [slotNumber, diskId];
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
