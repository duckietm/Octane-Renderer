import { IMessageComposer } from '@nitrots/api';

export class YouTubeRoomPlayComposer implements IMessageComposer<any[]>
{
    private _data: any[];

    constructor(videoId: string, playlist: string[])
    {
        this._data = [videoId, playlist.length, ...playlist];
    }

    public getMessageArray()
    {
        return this._data;
    }
    public dispose(): void
    {}
}
