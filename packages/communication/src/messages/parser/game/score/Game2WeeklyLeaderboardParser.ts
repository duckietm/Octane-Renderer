import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { LeaderboardEntry } from './LeaderboardEntry';

export class Game2WeeklyLeaderboardParser implements IMessageParser
{
    private _year: number;
    private _week: number;
    private _maxOffset: number;
    private _currentOffset: number;
    private _minutesUntilReset: number;
    private _leaderboard: LeaderboardEntry[];
    private _totalListSize: number;
    private _gameTypeId: number;

    public flush(): boolean
    {
        this._year = -1;
        this._week = -1;
        this._maxOffset = -1;
        this._currentOffset = -1;
        this._minutesUntilReset = -1;
        this._leaderboard = [];
        this._totalListSize = -1;
        this._gameTypeId = -1;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._year = wrapper.readInt();
        this._week = wrapper.readInt();
        this._maxOffset = wrapper.readInt();
        this._currentOffset = wrapper.readInt();
        this._minutesUntilReset = wrapper.readInt();
        const count = wrapper.readInt();
        this._leaderboard = [];
        for(let index = 0; index < count; index++) this._leaderboard.push(new LeaderboardEntry(wrapper));
        this._totalListSize = wrapper.readInt();
        this._gameTypeId = wrapper.readInt();

        return true;
    }

    public get year(): number
    {
        return this._year;
    }

    public get week(): number
    {
        return this._week;
    }

    public get maxOffset(): number
    {
        return this._maxOffset;
    }

    public get currentOffset(): number
    {
        return this._currentOffset;
    }

    public get minutesUntilReset(): number
    {
        return this._minutesUntilReset;
    }

    public get leaderboard(): LeaderboardEntry[]
    {
        return this._leaderboard;
    }

    public get totalListSize(): number
    {
        return this._totalListSize;
    }

    public get gameTypeId(): number
    {
        return this._gameTypeId;
    }
}
