import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class YouTubeRoomSettingsParser implements IMessageParser
{
    private _youtubeEnabled: boolean;

    public flush(): boolean
    {
        this._youtubeEnabled = false;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;
        this._youtubeEnabled = wrapper.readInt() === 1;
        return true;
    }

    public get youtubeEnabled(): boolean
    {
        return this._youtubeEnabled;
    }
}
