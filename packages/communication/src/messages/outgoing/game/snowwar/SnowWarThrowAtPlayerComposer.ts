import { IMessageComposer } from '@octane/api';

export class SnowWarThrowAtPlayerComposer implements IMessageComposer<ConstructorParameters<typeof SnowWarThrowAtPlayerComposer>>
{
    private _data: ConstructorParameters<typeof SnowWarThrowAtPlayerComposer>;

    constructor(targetObjectId: number, trajectory: number, turn: number = 0, subturn: number = 0)
    {
        this._data = [ targetObjectId, trajectory, turn, subturn ];
    }

    dispose(): void
    {
        this._data = null;
    }

    public getMessageArray()
    {
        return this._data;
    }
}
