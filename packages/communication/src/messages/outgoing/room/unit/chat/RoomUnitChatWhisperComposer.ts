import { IMessageComposer } from '@octane/api';

export class RoomUnitChatWhisperComposer implements IMessageComposer<[string, number, string]>
{
    private _data: [string, number, string];

    // The server reads a colour after the style, as for talk and shout; without it the whisper ended short.
    constructor(recipientName: string, message: string, styleId: number, chatColour: string = '')
    {
        this._data = [(recipientName + ' ' + message), styleId, chatColour];
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
