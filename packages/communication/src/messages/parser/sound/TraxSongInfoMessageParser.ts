import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { SongInfoEntry } from './SongInfoEntry';

export class TraxSongInfoMessageParser implements IMessageParser
{
    private _songs: SongInfoEntry[];

    flush(): boolean
    {
        this._songs = [];
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        const count = wrapper.readInt();
        for(let i = 0; i < count; i++)
        {
            const id = wrapper.readInt();
            const code = wrapper.readString();
            const name = wrapper.readString();
            const data = wrapper.readString();
            const length = wrapper.readInt();
            const creator = wrapper.readString();
            const song = new SongInfoEntry(id, length, name, creator, data);
            this._songs.push(song);
        }
        return true;
    }

    public get songs(): SongInfoEntry[]
    {
        return this._songs;
    }
}
