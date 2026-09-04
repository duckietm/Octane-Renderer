import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';

export class YouTubeRoomBroadcastParser implements IMessageParser
{
    private _videoId: string;
    private _senderName: string;
    private _playlist: string[];

    public flush(): boolean
    {
        this._videoId = '';
        this._senderName = '';
        this._playlist = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._videoId = wrapper.readString();
        this._senderName = wrapper.readString();
        const count = wrapper.readInt();
        this._playlist = [];
        for(let i = 0; i < count; i++)
        {
            this._playlist.push(wrapper.readString());
        }
        return true;
    }

    public get videoId(): string
    {
        return this._videoId;
    }
    public get senderName(): string
    {
        return this._senderName;
    }
    public get playlist(): string[]
    {
        return this._playlist;
    }
}
