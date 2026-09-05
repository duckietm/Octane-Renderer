import { OctaneEvent } from '@octane/events';

export class SongInfoReceivedEvent extends OctaneEvent
{
    public static readonly SIR_TRAX_SONG_INFO_RECEIVED = 'SIR_TRAX_SONG_INFO_RECEIVED';

    private _id:number;

    constructor(type:string, id:number)
    {
        super(type);
        this._id = id;
    }

    public get id():number
    {
        return this._id;
    }
}
