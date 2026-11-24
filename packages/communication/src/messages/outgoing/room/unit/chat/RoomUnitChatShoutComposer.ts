import { IMessageComposer } from '@octane/api';

export class RoomUnitChatShoutComposer implements IMessageComposer<ConstructorParameters<typeof RoomUnitChatShoutComposer>>
{
    private _data: ConstructorParameters<typeof RoomUnitChatShoutComposer>;

    // The same defaults as RoomUnitChatComposer: a shout sent without a chat colour carried `undefined` as its third
    // field, which cannot be written to the wire, so the shout was never sent.
    constructor(message: string, styleId: number = 0, chatColour: string = '')
    {
        this._data = [message, styleId, chatColour];
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
