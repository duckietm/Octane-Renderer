import { IMessageComposer } from '@nitrots/api';

export class SoundboardPlayComposer implements IMessageComposer<[ number ]>
{
    private _data: [ number ];

    constructor(soundId: number)
    {
        this._data = [ soundId ];
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
