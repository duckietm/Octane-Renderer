import { IMessageComposer } from '@octane/api';

export class SnowWarCreateSnowballComposer implements IMessageComposer<ConstructorParameters<typeof SnowWarCreateSnowballComposer>>
{
    private _data: ConstructorParameters<typeof SnowWarCreateSnowballComposer>;

    constructor(turn: number = 0, subturn: number = 0)
    {
        this._data = [ turn, subturn ];
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
