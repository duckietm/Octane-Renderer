import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SongDataEntry } from '../common/SongDataEntry';
import { JukeboxPlaylistController } from './JukeboxPlaylistController';

const state = vi.hoisted(() => ({
    songs: new Map<number, any>(),
    dispatched: [] as string[],
    requestSongInfoWithoutSamples: null as any
}));

vi.mock('@octane/communication', () => ({
    GetCommunication: () => ({ registerMessageEvent: vi.fn(), removeMessageEvent: vi.fn() }),
    GetJukeboxPlayListMessageComposer: class {},
    JukeboxPlayListFullMessageEvent: class {},
    JukeboxSongDisksMessageEvent: class {},
    NowPlayingMessageEvent: class {}
}));
vi.mock('@octane/events', () => ({
    GetEventDispatcher: () => ({ addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: (event: { type: string }) => state.dispatched.push(event.type) }),
    NowPlayingEvent: class {},
    PlayListStatusEvent: class
    {
        public static PLUE_PLAY_LIST_UPDATED = 'PLUE_PLAY_LIST_UPDATED';
        public static PLUE_PLAY_LIST_FULL = 'PLUE_PLAY_LIST_FULL';

        constructor(public type: string) {}
    },
    SongInfoReceivedEvent: class
    {
        public static SIR_TRAX_SONG_INFO_RECEIVED = 'SIR_TRAX_SONG_INFO_RECEIVED';
    }
}));
vi.mock('../GetSoundManager', () => ({
    GetSoundManager: () => ({
        musicController: {
            getSongInfo: (id: number) => state.songs.get(id) ?? null,
            requestSongInfoWithoutSamples: state.requestSongInfoWithoutSamples
        }
    })
}));

const disks = (pairs: [ number, number ][]) => ({
    getParser: () => ({
        songDisks: {
            length: pairs.length,
            getKey: (index: number) => pairs[index][0],
            getWithIndex: (index: number) => pairs[index][1]
        }
    })
});

const receiveDisks = (controller: JukeboxPlaylistController, pairs: [ number, number ][]) => (controller as any).onJukeboxSongDisksMessageEvent(disks(pairs));
const receiveSongInfo = (controller: JukeboxPlaylistController, id: number) => (controller as any).onSongInfoReceivedEvent({ id });

beforeEach(() =>
{
    state.songs.clear();
    state.dispatched.length = 0;
    state.requestSongInfoWithoutSamples = vi.fn();
});

describe('JukeboxPlaylistController disk list', () =>
{
    it('announces the playlist at once even when a song info never arrives', () =>
    {
        const controller = new JukeboxPlaylistController();

        receiveDisks(controller, [ [ 10, 1 ] ]);

        expect(state.dispatched).toEqual([ 'PLUE_PLAY_LIST_UPDATED' ]);
        expect(controller.getEntry(0).id).toBe(1);
        expect(state.requestSongInfoWithoutSamples).toHaveBeenCalledWith(1);
    });

    it('gives each disk of the same song its own entry and leaves the cached info untouched', () =>
    {
        const cached = new SongDataEntry(1, 30, 'song', 'creator', 'data');
        state.songs.set(1, cached);

        const controller = new JukeboxPlaylistController();

        receiveDisks(controller, [ [ 10, 1 ], [ 11, 1 ] ]);

        expect(controller.getEntry(0).diskId).toBe(10);
        expect(controller.getEntry(1).diskId).toBe(11);
        expect(controller.getEntry(0).name).toBe('song');
        expect(cached.diskId).toBe(-1);
    });

    it('fills in a late song info on every disk that holds it', () =>
    {
        const controller = new JukeboxPlaylistController();

        receiveDisks(controller, [ [ 10, 1 ], [ 11, 1 ] ]);
        state.songs.set(1, new SongDataEntry(1, 30, 'song', 'creator', 'data'));
        receiveSongInfo(controller, 1);

        expect(controller.getEntry(0)).toMatchObject({ name: 'song', diskId: 10 });
        expect(controller.getEntry(1)).toMatchObject({ name: 'song', diskId: 11 });
        expect(state.dispatched).toEqual([ 'PLUE_PLAY_LIST_UPDATED', 'PLUE_PLAY_LIST_UPDATED' ]);
    });

    it('forgets the missing songs of a replaced disk list', () =>
    {
        const controller = new JukeboxPlaylistController();

        receiveDisks(controller, [ [ 10, 1 ] ]);
        receiveDisks(controller, [ [ 12, 2 ] ]);
        state.dispatched.length = 0;
        state.songs.set(1, new SongDataEntry(1, 30, 'song', 'creator', 'data'));
        receiveSongInfo(controller, 1);

        expect(state.dispatched).toEqual([]);
        expect(controller.getEntry(0).id).toBe(2);
    });
});
