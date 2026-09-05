import { IMessageComposer } from '@octane/api';

export class SnowWarWalkComposer implements IMessageComposer<ConstructorParameters<typeof SnowWarWalkComposer>>
{
    private _data: ConstructorParameters<typeof SnowWarWalkComposer>;

    constructor(worldX: number, worldY: number, turn: number = 0, subturn: number = 0)
    {
        this._data = [ worldX, worldY, turn, subturn ];
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
