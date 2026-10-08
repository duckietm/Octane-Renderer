import { IMessageComposer } from '@octane/api';

export class SoundboardSetEnabledComposer implements IMessageComposer<[ number ]>
{
    private _data: [ number ];

    /**
     * @param mode 0 nobody, 1 everyone, 2 only people with rights in the room.
     * A boolean still works for callers that only know on and off.
     */
    constructor(mode: number | boolean)
    {
        this._data = [ Number(mode) ];
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
