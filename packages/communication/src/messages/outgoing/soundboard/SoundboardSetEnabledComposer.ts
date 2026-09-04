import { IMessageComposer } from '@nitrots/api';

export class SoundboardSetEnabledComposer implements IMessageComposer<[ number ]>
{
    private _data: [ number ];

    constructor(enabled: boolean)
    {
        this._data = [ enabled ? 1 : 0 ];
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
