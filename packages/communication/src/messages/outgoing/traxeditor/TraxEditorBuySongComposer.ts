import { IMessageComposer } from '@nitrots/api';

export class TraxEditorBuySongComposer implements IMessageComposer<[ string ]>
{
    private _data: [ string ];

    constructor(name: string)
    {
        this._data = [ name ];
    }

    public getMessageArray(): [ string ]
    {
        return this._data;
    }
    public dispose(): void
    {
        return;
    }
}
