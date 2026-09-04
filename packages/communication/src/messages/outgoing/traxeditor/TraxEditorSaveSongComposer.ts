import { IMessageComposer } from '@nitrots/api';

export class TraxEditorSaveSongComposer implements IMessageComposer<[ number, string, string ]>
{
    private _data: [ number, string, string ];

    constructor(songId: number, name: string, data: string)
    {
        this._data = [ songId, name, data ];
    }

    public getMessageArray(): [ number, string, string ]
    {
        return this._data;
    }
    public dispose(): void
    {
        return;
    }
}
