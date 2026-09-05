import { IMessageComposer } from '@octane/api';

export class SoundboardCatalogReorderComposer implements IMessageComposer<number[]>
{
    private readonly _data: number[];

    constructor(orderedIds: number[])
    {
        this._data = [ orderedIds.length, ...orderedIds ];
    }

    public getMessageArray(): number[]
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
