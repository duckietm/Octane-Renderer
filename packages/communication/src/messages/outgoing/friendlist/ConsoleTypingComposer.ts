import { IMessageComposer } from '@octane/api';

export class ConsoleTypingComposer implements IMessageComposer<ConstructorParameters<typeof ConsoleTypingComposer>>
{
    private _data: ConstructorParameters<typeof ConsoleTypingComposer>;

    constructor(peerId: number, isTyping: boolean)
    {
        this._data = [ peerId, isTyping ];
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
