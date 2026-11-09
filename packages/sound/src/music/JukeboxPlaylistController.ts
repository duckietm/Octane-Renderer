import { IMessageEvent, IPlaylistController, ISongInfo } from '@octane/api';
import { GetCommunication, GetJukeboxPlayListMessageComposer, JukeboxPlayListFullMessageEvent, JukeboxSongDisksMessageEvent, NowPlayingMessageEvent } from '@octane/communication';
import { GetEventDispatcher, NowPlayingEvent, PlayListStatusEvent, SongInfoReceivedEvent } from '@octane/events';
import { GetSoundManager } from '../GetSoundManager';
import { SongDataEntry } from '../common';
import { MusicPriorities } from './MusicPriorities';

export class JukeboxPlaylistController implements IPlaylistController
{
    private _isPlaying = false;
    private _entries: ISongInfo[];
    private _currentSongId: number = -1;
    private _missingSongInfo: Set<number> = new Set();
    private _playPosition: number = -1;
    private _disposed: boolean = false;
    private _messageEvents: IMessageEvent[] = [];

    constructor()
    {
        this.onSongInfoReceivedEvent = this.onSongInfoReceivedEvent.bind(this);
    }

    public init(): void
    {
        this._messageEvents = [
            new NowPlayingMessageEvent(this.onNowPlayingMessageEvent.bind(this)),
            new JukeboxSongDisksMessageEvent(this.onJukeboxSongDisksMessageEvent.bind(this)),
            new JukeboxPlayListFullMessageEvent(this.onJukeboxPlayListFullMessageEvent.bind(this))
        ];

        this._messageEvents.forEach(event => GetCommunication().registerMessageEvent(event));

        GetEventDispatcher().addEventListener(SongInfoReceivedEvent.SIR_TRAX_SONG_INFO_RECEIVED, this.onSongInfoReceivedEvent);
    }

    public dispose(): void
    {
        if(this._disposed) return;

        this.stopPlaying();

        GetEventDispatcher().removeEventListener(SongInfoReceivedEvent.SIR_TRAX_SONG_INFO_RECEIVED, this.onSongInfoReceivedEvent);

        this._messageEvents.forEach(event => GetCommunication().removeMessageEvent(event));

        this._disposed = true;
    }

    private onNowPlayingMessageEvent(event: NowPlayingMessageEvent): void
    {
        const parser = event.getParser();

        this._isPlaying = (parser.currentSongId !== -1);

        if(parser.currentSongId >= 0)
        {
            GetSoundManager().musicController.playSong(parser.currentSongId, MusicPriorities.PRIORITY_ROOM_PLAYLIST, (parser.syncCount / 1000), 0, 1, 1);
            this._currentSongId = parser.currentSongId;
        }
        else
        {
            this.stopPlaying();
        }

        if(parser.nextSongId >= 0) GetSoundManager().musicController.addSongInfoRequest(parser.nextSongId);

        this._playPosition = parser.currentPosition;

        GetEventDispatcher().dispatchEvent(new NowPlayingEvent(NowPlayingEvent.NPE_SONG_CHANGED, MusicPriorities.PRIORITY_ROOM_PLAYLIST, parser.currentSongId, parser.currentPosition));
    }

    private onJukeboxSongDisksMessageEvent(event: JukeboxSongDisksMessageEvent): void
    {
        const parser = event.getParser();

        this._entries = [];
        this._missingSongInfo.clear();

        for(let i = 0; i < parser.songDisks.length; i++)
        {
            const songId = parser.songDisks.getWithIndex(i);
            const diskId = parser.songDisks.getKey(i);
            const songInfo = GetSoundManager().musicController.getSongInfo(songId);

            if(!songInfo)
            {
                this._missingSongInfo.add(songId);

                GetSoundManager().musicController.requestSongInfoWithoutSamples(songId);
            }

            // Each disk gets its own entry: the cached song info is shared, and two disks of the same song would overwrite each other's disk id.
            this._entries.push(this.createDiskEntry(songInfo, songId, diskId));
        }

        // Announce the playlist right away; a song whose info never arrives would otherwise hold it back for good.
        GetEventDispatcher().dispatchEvent(new PlayListStatusEvent(PlayListStatusEvent.PLUE_PLAY_LIST_UPDATED));
    }

    private createDiskEntry(songInfo: ISongInfo, songId: number, diskId: number): SongDataEntry
    {
        const entry = songInfo
            ? new SongDataEntry(songInfo.id, songInfo.length, songInfo.name, songInfo.creator, songInfo.songData)
            : new SongDataEntry(songId, -1, null, null, null);

        entry.diskId = diskId;

        return entry;
    }

    private onJukeboxPlayListFullMessageEvent(event: JukeboxPlayListFullMessageEvent): void
    {
        GetEventDispatcher().dispatchEvent(new PlayListStatusEvent(PlayListStatusEvent.PLUE_PLAY_LIST_FULL));
    }

    private onSongInfoReceivedEvent(event: SongInfoReceivedEvent): void
    {
        if(!this._missingSongInfo.delete(event.id)) return;

        const songInfo = GetSoundManager().musicController.getSongInfo(event.id);

        if(!songInfo) return;

        for(let i = 0; i < this.length; i++)
        {
            const songData = this._entries[i];

            if(songData.id === event.id) this._entries[i] = this.createDiskEntry(songInfo, event.id, songData.diskId);
        }

        GetEventDispatcher().dispatchEvent(new PlayListStatusEvent(PlayListStatusEvent.PLUE_PLAY_LIST_UPDATED));
    }

    public stopPlaying(): void
    {
        GetSoundManager().musicController.stop(this.priority);

        this._currentSongId = -1;
        this._playPosition = -1;
        this._isPlaying = false;
    }

    public getEntry(index: number): ISongInfo
    {
        if((index < 0) || (index >= this._entries.length)) return null;

        return this._entries[index];
    }

    public requestPlayList(): void
    {
        GetCommunication().connection.send(new GetJukeboxPlayListMessageComposer());
    }

    public get priority(): number
    {
        return MusicPriorities.PRIORITY_ROOM_PLAYLIST;
    }

    public get length(): number
    {
        if(!this._entries) return 0;

        return this._entries.length;
    }

    public get playPosition(): number
    {
        return this._playPosition;
    }

    public get currentSongId(): number
    {
        return this._currentSongId;
    }

    public get isPlaying(): boolean
    {
        return this._isPlaying;
    }

    public get entries(): ISongInfo[]
    {
        return this._entries;
    }
}
