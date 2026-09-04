import { IMessageComposer } from '@nitrots/api';

export class SoundboardSaveVolumeComposer implements IMessageComposer<[ number ]>
{
    private readonly _data: [ number ];

    constructor(volume: number)
    {
        this._data = [ Math.max(0, Math.min(100, Math.round(volume))) ];
    }

    public getMessageArray(): [ number ]
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
