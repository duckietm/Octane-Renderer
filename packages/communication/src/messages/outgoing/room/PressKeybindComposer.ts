import { IMessageComposer } from '@octane/api';

// Sent when a user presses a configured keybind key in the room. Payload: the pressed key code.
// Server header 9311 -> PressKeybindEvent -> WiredManager.triggerKeybind.
export class PressKeybindComposer implements IMessageComposer<ConstructorParameters<typeof PressKeybindComposer>>
{
    private _data: ConstructorParameters<typeof PressKeybindComposer>;

    constructor(keyCode: number)
    {
        this._data = [keyCode];
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
