import { IMessageComposer } from '@nitrots/api';

export class GetTraxEditorSongsComposer implements IMessageComposer<[]>
{
    private _data: [];

    constructor()
    {
        this._data = [];
    }

    public getMessageArray(): []
    {
        return this._data;
    }
    public dispose(): void
    {
        return;
    }
}
