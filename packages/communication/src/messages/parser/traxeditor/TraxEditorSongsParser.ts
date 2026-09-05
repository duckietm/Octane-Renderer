import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface ITraxEditorSong
{
    id: number;
    name: string;
    data: string;
    length: number;
}

export class TraxEditorSongsParser implements IMessageParser
{
    private _maxSongs: number = 0;
    private _costCurrency: number = 0;
    private _costAmount: number = 0;
    private _songs: ITraxEditorSong[] = [];

    public flush(): boolean
    {
        this._maxSongs = 0;
        this._costCurrency = 0;
        this._costAmount = 0;
        this._songs = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._maxSongs = wrapper.readInt();
        this._costCurrency = wrapper.readInt();
        this._costAmount = wrapper.readInt();

        const count = wrapper.readInt();
        this._songs = [];

        for(let i = 0; i < count; i++)
        {
            this._songs.push({
                id: wrapper.readInt(),
                name: wrapper.readString(),
                data: wrapper.readString(),
                length: wrapper.readInt()
            });
        }

        return true;
    }

    public get maxSongs(): number
    {
        return this._maxSongs;
    }
    public get costCurrency(): number
    {
        return this._costCurrency;
    }
    public get costAmount(): number
    {
        return this._costAmount;
    }
    public get songs(): ITraxEditorSong[]
    {
        return this._songs;
    }
}
