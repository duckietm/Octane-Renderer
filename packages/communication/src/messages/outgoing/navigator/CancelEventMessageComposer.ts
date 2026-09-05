import { IMessageComposer } from '@octane/api';

export class CancelEventMessageComposer implements IMessageComposer<ConstructorParameters<typeof CancelEventMessageComposer>>
{
    private _data: ConstructorParameters<typeof CancelEventMessageComposer>;

    constructor(advertisementId: number)
    {
        this._data = [advertisementId];
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
