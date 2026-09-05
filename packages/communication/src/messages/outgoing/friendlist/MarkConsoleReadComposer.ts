import { IMessageComposer } from '@octane/api';

export class MarkConsoleReadComposer implements IMessageComposer<ConstructorParameters<typeof MarkConsoleReadComposer>>
{
    private _data: ConstructorParameters<typeof MarkConsoleReadComposer>;

    constructor(peerId: number)
    {
        this._data = [ peerId ];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
