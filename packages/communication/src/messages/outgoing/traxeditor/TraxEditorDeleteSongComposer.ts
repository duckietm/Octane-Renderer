import { IMessageComposer } from '@octane/api';

export class TraxEditorDeleteSongComposer implements IMessageComposer<[ number ]>
{
    private _data: [ number ];

    constructor(songId: number)
    {
        this._data = [ songId ];
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
