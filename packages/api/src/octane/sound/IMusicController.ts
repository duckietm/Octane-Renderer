import { IAdvancedMap } from '../../utils';
import { IPlaylistController } from './IPlaylistController';
import { ISongInfo } from './ISongInfo';

export interface IMusicController
{
    getRoomItemPlaylist(priority?: number): IPlaylistController;
    getSongDiskInventorySize(): number;
    getSongDiskInventoryDiskId(index: number): number;
    getSongDiskInventorySongId(index: number): number;
    getSongInfo(songId: number): ISongInfo;
    getSongIdPlayingAtPriority(priority: number): number;
    playSong(songId: number, priority: number, startPos?: number, playLength?: number, fadeInSeconds?: number, fadeOutSeconds?: number): boolean;
    stop(priority: number): void;
    previewTraxData(songData: string, startPosSeconds?: number): Promise<void>;
    stopPreview(): void;
    previewSample(sampleId: number): Promise<void>;
    stopSamplePreview(): void;
    addSongInfoRequest(songId: number): void;
    requestSongInfoWithoutSamples(songId: number): void;
    requestUserSongDisks(): void;
    onSongLoaded(songId: number): void;
    updateVolume(volume: number): void;
    samplesUnloaded(sampleIds: number[]): void;
    get samplesIdsInUse(): number[];
    get songDiskInventory(): IAdvancedMap<number, number>
    init(): void;
    dispose(): void;
}
