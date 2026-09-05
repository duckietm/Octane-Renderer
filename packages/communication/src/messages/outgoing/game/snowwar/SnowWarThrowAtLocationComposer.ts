import { IMessageComposer } from '@octane/api';

export class SnowWarThrowAtLocationComposer implements IMessageComposer<ConstructorParameters<typeof SnowWarThrowAtLocationComposer>>
{
    private _data: ConstructorParameters<typeof SnowWarThrowAtLocationComposer>;

    constructor(worldX: number, worldY: number, trajectory: number, turn: number = 0, subturn: number = 0)
    {
        this._data = [ worldX, worldY, trajectory, turn, subturn ];
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
