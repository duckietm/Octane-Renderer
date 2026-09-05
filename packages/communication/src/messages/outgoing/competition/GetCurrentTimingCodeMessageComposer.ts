import { IMessageComposer } from '@octane/api';

export class GetCurrentTimingCodeMessageComposer implements IMessageComposer<ConstructorParameters<typeof GetCurrentTimingCodeMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetCurrentTimingCodeMessageComposer>;

    constructor(slotConfig: string)
    {
        this._data = [slotConfig];
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
