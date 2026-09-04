import { IAdvancedMap, IMessageEvent, IMusicController, IPlaylistController, ISongInfo } from '@nitrots/api';
import { GetCommunication, GetNowPlayingMessageComposer, GetSongInfoMessageComposer, GetUserSongDisksMessageComposer, TraxSongInfoMessageEvent, UserSongDisksInventoryMessageEvent } from '@nitrots/communication';
import { GetConfiguration } from '@nitrots/configuration';
import { GetEventDispatcher, NotifyPlayedSongEvent, NowPlayingEvent, RoomObjectSoundMachineEvent, SongDiskInventoryReceivedEvent, SongInfoReceivedEvent, SoundManagerEvent } from '@nitrots/events';
import { AdvancedMap } from '@nitrots/utils';
import { GetSoundManager } from '../GetSoundManager';
import { SongDataEntry, SongStartRequestData } from '../common';
import { TraxData } from '../trax/TraxData';
import { JukeboxPlaylistController } from './JukeboxPlaylistController';
import { MusicPlayer } from './MusicPlayer';
import { MusicPriorities } from './MusicPriorities';

export class MusicController implements IMusicController
{
    public static readonly SKIP_POSITION_SET: number = -1;
    private static readonly MAXIMUM_NOTIFY_PRIORITY: number = MusicPriorities.PRIORITY_ROOM_PLAYLIST;

    private _timerInstance: number = 1;
    private _songRequestList: number[] = [];
    private _requestedSongs: Map<number, boolean> = new Map();
    private _availableSongs: Map<number, SongDataEntry> = new Map();
    private _songRequestsPerPriority: SongStartRequestData[] = [];
    private _songRequestCountsPerPriority: number[] = [];
    private _diskInventoryMissingData: number[] = [];
    private _songDiskInventory: IAdvancedMap<number, number> = new AdvancedMap();
    private _priorityPlaying: number = -1;
    private _requestNumberPlaying: number = -1;
    private _roomItemPlaylist: IPlaylistController;
    private _musicPlayer: MusicPlayer;

    private _songIdPlaying: number = 1;
    private _previousNotifiedSongId: number = -1;
    private _previousNotificationTime: number = -1;
    private _messageEvents: IMessageEvent[] = [];

    constructor()
    {
        this.onJukeboxInit = this.onJukeboxInit.bind(this);
        this.onJukeboxDispose = this.onJukeboxDispose.bind(this);
        this.onSoundMachineInit = this.onSoundMachineInit.bind(this);
        this.onSoundMachineDispose = this.onSoundMachineDispose.bind(this);

        this.onTraxSongComplete = this.onTraxSongComplete.bind(this);
    }

    public init(): void
    {
        // Store message events for cleanup
        this._messageEvents.push(
            GetCommunication().registerMessageEvent(new TraxSongInfoMessageEvent(this.onTraxSongInfoMessageEvent.bind(this))),
            GetCommunication().registerMessageEvent(new UserSongDisksInventoryMessageEvent(this.onSongDiskInventoryMessage.bind(this)))
        );

        this._timerInstance = window.setInterval(this.onTick.bind(this), 1000);
        this._musicPlayer = new MusicPlayer(GetConfiguration().getValue<string>('external.samples.url'));

        GetEventDispatcher().addEventListener(RoomObjectSoundMachineEvent.JUKEBOX_INIT, this.onJukeboxInit);
        GetEventDispatcher().addEventListener(RoomObjectSoundMachineEvent.JUKEBOX_DISPOSE, this.onJukeboxDispose);
        GetEventDispatcher().addEventListener(RoomObjectSoundMachineEvent.SOUND_MACHINE_INIT, this.onSoundMachineInit);
        GetEventDispatcher().addEventListener(RoomObjectSoundMachineEvent.SOUND_MACHINE_DISPOSE, this.onSoundMachineDispose);
        GetEventDispatcher().addEventListener(SoundManagerEvent.TRAX_SONG_COMPLETE, this.onTraxSongComplete);
    }

    public getRoomItemPlaylist(roomId?: number): IPlaylistController
    {
        return this._roomItemPlaylist;
    }

    public get songDiskInventory(): IAdvancedMap<number, number>
    {
        return this._songDiskInventory;
    }

    public getSongDiskInventorySize(): number
    {
        return this._songDiskInventory.length;
    }

    public getSongDiskInventoryDiskId(index: number): number
    {
        if(((index >= 0) && (index < this._songDiskInventory.length)))
        {
            return this._songDiskInventory.getKey(index);
        }
        return -1;
    }

    public getSongDiskInventorySongId(index: number): number
    {
        if(((index >= 0) && (index < this._songDiskInventory.length)))
        {
            return this._songDiskInventory.getWithIndex(index);
        }
        return -1;
    }

    public getSongInfo(songId: number): ISongInfo
    {
        const songDataEntry: SongDataEntry = this.getSongDataEntry(songId);
        if(!songDataEntry)
        {
            this.requestSongInfoWithoutSamples(songId);
        }
        return songDataEntry;
    }

    public getSongIdPlayingAtPriority(priority: number): number
    {
        if(priority !== this._priorityPlaying)
        {
            return -1;
        }
        return this._songIdPlaying;
    }

    public stop(priority: number): void
    {
        const isCurrentPlayingPriority = (priority === this._priorityPlaying);
        const isTopRequestPriority = (this.getTopRequestPriority() === priority);
        if(isCurrentPlayingPriority)
        {
            this.resetSongStartRequest(priority);
            this.stopSongAtPriority(priority);
        }
        else
        {
            this.resetSongStartRequest(priority);
            if(isTopRequestPriority)
            {
                this.reRequestSongAtPriority(this._priorityPlaying);
            }
        }
    }

    /**
     * Plays a raw trax song-data string directly, bypassing the song-id
     * machinery — used by the trax editor to audition unsaved compositions.
     */
    public async previewTraxData(songData: string, startPosSeconds: number = 0): Promise<void>
    {
        this.stop(MusicPriorities.PRIORITY_PURCHASE_PREVIEW);
        this._musicPlayer.setVolume(GetSoundManager().traxVolume);
        await this._musicPlayer.preloadSamplesForSong(songData);
        await this._musicPlayer.play(songData, -1, Math.max(0, startPosSeconds), -1);
    }

    public stopPreview(): void
    {
        this._musicPlayer.stop();
    }

    /** Auditions a single sample once (trax editor sample buttons). */
    public async previewSample(sampleId: number): Promise<void>
    {
        this._musicPlayer.setVolume(GetSoundManager().traxVolume);
        await this._musicPlayer.playSampleOnce(sampleId);
    }

    public stopSamplePreview(): void
    {
        this._musicPlayer.stopSampleOnce();
    }

    public addSongInfoRequest(songId: number): void
    {
        this.requestSong(songId, true);
    }

    public requestSongInfoWithoutSamples(songId: number): void
    {
        this.requestSong(songId, false);
    }

    public requestUserSongDisks(): void
    {
        GetCommunication().connection.send(new GetUserSongDisksMessageComposer());
    }

    public updateVolume(volume: number): void
    {
        this._musicPlayer.setVolume(volume);
    }

    public dispose(): void
    {
        if(this._timerInstance)
        {
            clearInterval(this._timerInstance);
            this._timerInstance = undefined;
        }

        // Remove message events
        for(const event of this._messageEvents)
        {
            GetCommunication().removeMessageEvent(event);
        }
        this._messageEvents = [];

        GetEventDispatcher().removeEventListener(RoomObjectSoundMachineEvent.JUKEBOX_INIT, this.onJukeboxInit);
        GetEventDispatcher().removeEventListener(RoomObjectSoundMachineEvent.JUKEBOX_DISPOSE, this.onJukeboxDispose);
        GetEventDispatcher().removeEventListener(RoomObjectSoundMachineEvent.SOUND_MACHINE_INIT, this.onSoundMachineInit);
        GetEventDispatcher().removeEventListener(RoomObjectSoundMachineEvent.SOUND_MACHINE_DISPOSE, this.onSoundMachineDispose);
        GetEventDispatcher().removeEventListener(SoundManagerEvent.TRAX_SONG_COMPLETE, this.onTraxSongComplete);
    }

    public get samplesIdsInUse(): number[]
    {
        let request: SongStartRequestData;
        let songEntry: SongDataEntry;
        let sampleIds = [];
        for(let i = 0; i < this._songRequestsPerPriority.length; i++)
        {
            if(this._songRequestsPerPriority[i])
            {
                request = this._songRequestsPerPriority[i];
                songEntry = this._availableSongs.get(request.songId);
                if(songEntry)
                {
                    const songData = songEntry.songData;
                    if(songData.length > 0)
                    {
                        const traxData = new TraxData(songData);
                        sampleIds = sampleIds.concat(traxData.getSampleIds());
                    }
                }
            }
        }
        return sampleIds;
    }

    public onSongLoaded(songId: number): void
    {
        const priority = this.getTopRequestPriority();
        if(priority >= 0)
        {
            const songIdAtTopPriority = this.getSongIdRequestedAtPriority(priority);
            if(songId === songIdAtTopPriority)
            {
                this.playSongObject(priority, songId);
            }
        }
    }

    public samplesUnloaded(sampleIds: number[]): void
    {
        throw new Error('Method not implemented.');
    }

    protected onTraxSongComplete(event: SoundManagerEvent): void
    {
        if(this.getSongIdPlayingAtPriority(this._priorityPlaying) === event.id)
        {
            if(((this.getTopRequestPriority() === this._priorityPlaying) && (this.getSongRequestCountAtPriority(this._priorityPlaying) == this._requestNumberPlaying)))
            {
                this.resetSongStartRequest(this._priorityPlaying);
            }
            const priorityPlaying = this._priorityPlaying;
            this.playSongWithHighestPriority();
            if(priorityPlaying >= MusicPriorities.PRIORITY_SONG_PLAY)
            {
                GetEventDispatcher().dispatchEvent(new NowPlayingEvent(NowPlayingEvent.NPW_USER_STOP_SONG, priorityPlaying, event.id, -1));
            }
        }
    }

    private onTraxSongInfoMessageEvent(event: TraxSongInfoMessageEvent): void
    {
        const parser = event.getParser();

        for(const song of parser.songs)
        {
            const songAvailable = !!this.getSongDataEntry(song.id);
            const areSamplesRequested = !!this.areSamplesRequested(song.id);

            if(!songAvailable)
            {
                if(!areSamplesRequested)
                {
                    //_local_9 = this._soundManager.loadTraxSong(_local_6.id, _local_6.data);
                }

                const songInfoEntry: SongDataEntry = new SongDataEntry(song.id, song.length, song.name, song.creator, song.data);
                this._availableSongs.set(song.id, songInfoEntry);

                const topRequestPriotityIndex: number = this.getTopRequestPriority();
                const songId: number = this.getSongIdRequestedAtPriority(topRequestPriotityIndex);
                if(song.id === songId)
                {
                    this.playSongObject(topRequestPriotityIndex, songId);
                }
                GetEventDispatcher().dispatchEvent(new SongInfoReceivedEvent(SongInfoReceivedEvent.SIR_TRAX_SONG_INFO_RECEIVED, song.id));
                while(this._diskInventoryMissingData.indexOf(song.id) != -1)
                {
                    this._diskInventoryMissingData.splice(this._diskInventoryMissingData.indexOf(song.id), 1);
                    if(this._diskInventoryMissingData.length === 0)
                    {
                        GetEventDispatcher().dispatchEvent(new SongDiskInventoryReceivedEvent(SongDiskInventoryReceivedEvent.SDIR_SONG_DISK_INVENTORY_RECEIVENT_EVENT));
                    }
                }

            }
        }
    }

    private onSongDiskInventoryMessage(event: UserSongDisksInventoryMessageEvent): void
    {
        const parser = event.getParser();

        this._songDiskInventory.reset();
        for(let i = 0; i < parser.songDiskCount; i++)
        {
            const diskId = parser.getDiskId(i);
            const songId = parser.getSongId(i);
            this._songDiskInventory.add(diskId, songId);

            if(!this._availableSongs.get(songId))
            {
                this._diskInventoryMissingData.push(songId);
                this.requestSongInfoWithoutSamples(songId);
            }
        }
        // Always announce the refreshed list right away. Waiting for every
        // song's info deadlocked the UI whenever a disk referenced a song the
        // server can no longer resolve (e.g. a deleted composition) — that id
        // never arrives, the missing-data list never drains, and no disks show
        // at all. Names for songs still in flight fill in when their
        // TraxSongInfo lands, which re-dispatches this event.
        GetEventDispatcher().dispatchEvent(new SongDiskInventoryReceivedEvent(SongDiskInventoryReceivedEvent.SDIR_SONG_DISK_INVENTORY_RECEIVENT_EVENT));
    }

    private onTick(): void
    {
        if(this._songRequestList.length === 0) return;

        GetCommunication().connection.send(new GetSongInfoMessageComposer(...this._songRequestList));
        this._songRequestList = [];
    }

    private requestSong(songId: number, arg2: boolean): void
    {
        if(this._requestedSongs.get(songId) === undefined)
        {
            this._requestedSongs.set(songId, arg2);
            this._songRequestList.push(songId);
        }
    }

    private areSamplesRequested(songId: number): boolean
    {
        if(!this._requestedSongs.get(songId))
        {
            return false;
        }
        return this._requestedSongs.get(songId);
    }

    private processSongEntryForPlaying(songId: number, withSamples: boolean = true): boolean
    {
        const songData: SongDataEntry = this.getSongDataEntry(songId);
        if(!songData)
        {
            this.addSongInfoRequest(songId);
            return false;
        }
        /* if(_local_3.soundObject == null)
        {
            _local_3.soundObject = this._soundManager.loadTraxSong(_local_3.id, _local_3.songData);
        }
        const _local_4:IHabboSound = _local_3.soundObject;
        if(!_local_4.ready)
        {
            return false;
        } */
        return true;
    }

    public playSong(songId: number, priority: number, startPos: number = 0, playLength: number = 0, fadeInSeconds: number = 0.5, fadeOutSeconds: number = 0.5): boolean
    {
        if(!this.addSongStartRequest(priority, songId, startPos, playLength, fadeInSeconds, fadeOutSeconds))
        {
            return false;
        }
        if(!this.processSongEntryForPlaying(songId))
        {
            return false;
        }
        if(priority >= this._priorityPlaying)
        {
            this.playSongObject(priority, songId);
        }
        return true;
    }

    private playSongObject(priority: number, songId: number): boolean
    {
        if((((songId === -1) || (priority < 0)) || (priority >= MusicPriorities.PRIORITY_COUNT)))
        {
            return false;
        }
        let stopped = false;
        if(this.stopSongAtPriority(this._priorityPlaying))
        {
            stopped = true;
        }
        const songData: SongDataEntry = this.getSongDataEntry(songId);
        if(!songData)
        {
            return false;
        }
        if(stopped)
        {
            return true;
        }
        this._musicPlayer.setVolume(GetSoundManager().traxVolume);
        let startPos = MusicController.SKIP_POSITION_SET;
        let playLength = 0;
        let fadeInSeconds = 2;
        let fadeOutSeconds = 1;

        const songRequestData: SongStartRequestData = this.getSongStartRequest(priority);

        if(songRequestData)
        {
            startPos = songRequestData.startPos;
            playLength = songRequestData.playLength;
            fadeInSeconds = songRequestData.fadeInSeconds;
            fadeOutSeconds = songRequestData.fadeOutSeconds;
        }
        if(startPos >= (songData.length / 1000))
        {
            return false;
        }
        if(startPos <= MusicController.SKIP_POSITION_SET)
        {
            startPos = 0;
        }

        startPos = Math.trunc(startPos);
        /*
        _local_5.fadeInSeconds = _local_8;
        _local_5.fadeOutSeconds = _local_9;
        _local_5.position = _local_6;
        _local_5.play(_local_7);
        */

        this._priorityPlaying = priority;
        this._requestNumberPlaying = this.getSongRequestCountAtPriority(priority);
        this._songIdPlaying = songId;
        if(this._priorityPlaying <= MusicController.MAXIMUM_NOTIFY_PRIORITY)
        {
            this.notifySongPlaying(songData);
        }
        this._musicPlayer.preloadSamplesForSong(songData.songData).then(() => this._musicPlayer.play(songData.songData, songData.id, startPos, playLength));
        if(priority > MusicPriorities.PRIORITY_ROOM_PLAYLIST)
        {
            GetEventDispatcher().dispatchEvent(new NowPlayingEvent(NowPlayingEvent.NPE_USER_PLAY_SONG, priority, songData.id, -1));
        }
        return true;
    }

    private notifySongPlaying(song: SongDataEntry): void
    {
        const notifyThreshold = 8000;
        const timeNow = Date.now();
        if(((song.length >= notifyThreshold) && ((!(this._previousNotifiedSongId == song.id)) || (timeNow > (this._previousNotificationTime + notifyThreshold)))))
        {
            GetEventDispatcher().dispatchEvent(new NotifyPlayedSongEvent(song.name, song.creator));
            this._previousNotifiedSongId = song.id;
            this._previousNotificationTime = timeNow;
        }
    }

    private addSongStartRequest(priority: number, songId: number, startPos: number, playLength: number, fadeInSeconds: number, fadeOutSeconds: number): boolean
    {
        if(((priority < 0) || (priority >= MusicPriorities.PRIORITY_COUNT)))
        {
            return false;
        }
        const songStartRequest = new SongStartRequestData(songId, startPos, playLength, fadeInSeconds, fadeOutSeconds);
        this._songRequestsPerPriority[priority] = songStartRequest;
        this._songRequestCountsPerPriority[priority] = (this._songRequestCountsPerPriority[priority] + 1);
        return true;
    }

    private getSongDataEntry(songId: number): SongDataEntry
    {
        let entry: SongDataEntry;
        if(this._availableSongs)
        {
            entry = (this._availableSongs.get(songId));
        }
        return entry;
    }

    private getSongStartRequest(priority: number): SongStartRequestData
    {
        return this._songRequestsPerPriority[priority];
    }

    private getTopRequestPriority(): number
    {
        return this._songRequestsPerPriority.length - 1;
    }

    private getSongIdRequestedAtPriority(priorityIndex: number): number
    {
        if(priorityIndex < 0 || priorityIndex >= MusicPriorities.PRIORITY_COUNT) return -1;

        if(!this._songRequestsPerPriority[priorityIndex]) return -1;

        return this._songRequestsPerPriority[priorityIndex].songId;
    }

    private getSongRequestCountAtPriority(priority: number): number
    {
        if(((priority < 0) || (priority >= MusicPriorities.PRIORITY_COUNT)))
        {
            return -1;
        }
        return this._songRequestCountsPerPriority[priority];
    }

    private playSongWithHighestPriority(): void
    {
        let songId: number;
        this._priorityPlaying = -1;
        this._songIdPlaying = -1;
        this._requestNumberPlaying = -1;
        const topPriority = this.getTopRequestPriority();
        let priority = topPriority;
        while(priority >= 0)
        {
            songId = this.getSongIdRequestedAtPriority(priority);
            if(((songId >= 0) && (this.playSongObject(priority, songId))))
            {
                return;
            }
            priority--;
        }
    }

    private resetSongStartRequest(priority: number): void
    {
        if(((priority >= 0) && (priority < MusicPriorities.PRIORITY_COUNT)))
        {
            this._songRequestsPerPriority[priority] = undefined;
        }
    }

    private reRequestSongAtPriority(priority: number): void
    {
        this._songRequestCountsPerPriority[priority] = (this._songRequestCountsPerPriority[priority] + 1);
    }

    private stopSongAtPriority(priority: number): boolean
    {
        if(((priority === this._priorityPlaying) && (this._priorityPlaying >= 0)))
        {
            const songIdAtPriority = this.getSongIdPlayingAtPriority(priority);
            if(songIdAtPriority >= 0)
            {
                const songData = this.getSongDataEntry(songIdAtPriority);
                //this.stopSongDataEntry(_local_3);
                this._musicPlayer.stop();
                return true;
            }
        }
        return false;
    }

    private onSoundMachineInit(event: Event): void
    {
        this.disposeRoomPlaylist();
        //this._roomItemPlaylist = (new SoundMachinePlayListController(this._soundManager, this, this._events) as IPlaylistController);
    }

    private onSoundMachineDispose(event: Event): void
    {
        this.disposeRoomPlaylist();
    }

    private onJukeboxInit(event: Event): void
    {
        this.disposeRoomPlaylist();
        this._roomItemPlaylist = (new JukeboxPlaylistController());
        this._roomItemPlaylist.init();
        GetCommunication().connection.send(new GetNowPlayingMessageComposer());
    }

    private onJukeboxDispose(event: Event): void
    {
        this.disposeRoomPlaylist();
    }

    private disposeRoomPlaylist(): void
    {
        if(this._roomItemPlaylist)
        {
            this._roomItemPlaylist.dispose();
            this._roomItemPlaylist = undefined;
        }
    }
}
