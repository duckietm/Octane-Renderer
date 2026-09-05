import { IMessageComposer } from '@octane/api';

export class SnowWarLoadStageReadyComposer implements IMessageComposer<ConstructorParameters<typeof SnowWarLoadStageReadyComposer>>
{
    private _data: ConstructorParameters<typeof SnowWarLoadStageReadyComposer>;

    constructor(percentage: number = 100)
    {
        this._data = [ percentage ];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        this._data = null;
    }
}
