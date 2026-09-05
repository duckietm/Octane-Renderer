import { IMessageComposer } from '@octane/api';

export class YouTubeRoomSettingsComposer implements IMessageComposer<any[]>
{
    private _data: any[];

    constructor(enabled: boolean)
    {
        this._data = [enabled ? 1 : 0];
    }

    public getMessageArray()
    {
        return this._data;
    }
    public dispose(): void
    {}
}
