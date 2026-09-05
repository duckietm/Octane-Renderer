import { IMessageDataWrapper } from '@octane/api';

export class LeaderboardEntry
{
    private _userId:number;
    private _score:number;
    private _rank:number;
    private _name:string;
    private _figure:string;
    private _gender:string;

    constructor(wrapper:IMessageDataWrapper)
    {
        this._userId = wrapper.readInt();
        this._score = wrapper.readInt();
        this._rank = wrapper.readInt();
        this._name = wrapper.readString();
        this._figure = wrapper.readString();
        this._gender = wrapper.readString();
    }

    public get userId():number
    {
        return this._userId;
    }

    public get score():number
    {
        return this._score;
    }

    public get rank():number
    {
        return this._rank;
    }

    public get figure():string
    {
        return this._figure;
    }

    public get gender():string
    {
        return this._gender;
    }

    public get name():string
    {
        return this._name;
    }
}
