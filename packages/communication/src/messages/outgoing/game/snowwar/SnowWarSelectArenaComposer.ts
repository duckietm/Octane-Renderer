import { IMessageComposer } from '@octane/api';

export class SnowWarSelectArenaComposer implements IMessageComposer<number[]>
{
    private _data: number[];

    constructor(arenaId: number)
    {
        this._data = [ arenaId ];
    }

    public getMessageArray(): number[]
    {
        return this._data;
    }
    public dispose(): void
    {
        this._data = null;
    }
}
