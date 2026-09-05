import { IMessageDataWrapper } from '@octane/api';

export class HousekeepingUserDetailData
{
    private _id: number = 0;
    private _username: string = '';
    private _motto: string = '';
    private _figure: string = '';
    private _rank: number = 0;
    private _rankName: string = '';
    private _online: boolean = false;
    private _lastOnlineAt: number = 0;
    private _creditsBalance: number = 0;
    private _ducketsBalance: number = 0;
    private _diamondsBalance: number = 0;
    private _email: string = '';
    private _ipLast: string = '';
    private _isBanned: boolean = false;
    private _isMuted: boolean = false;
    private _isTradeLocked: boolean = false;

    constructor(wrapper: IMessageDataWrapper)
    {
        if(!wrapper) throw new Error('invalid_wrapper');

        this._id = wrapper.readInt();
        this._username = wrapper.readString();
        this._motto = wrapper.readString();
        this._figure = wrapper.readString();
        this._rank = wrapper.readInt();
        this._rankName = wrapper.readString();
        this._online = wrapper.readBoolean();
        this._lastOnlineAt = wrapper.readInt();
        this._creditsBalance = wrapper.readInt();
        this._ducketsBalance = wrapper.readInt();
        this._diamondsBalance = wrapper.readInt();
        this._email = wrapper.readString();
        this._ipLast = wrapper.readString();
        this._isBanned = wrapper.readBoolean();

        if(wrapper.bytesAvailable) this._isMuted = wrapper.readBoolean();
        if(wrapper.bytesAvailable) this._isTradeLocked = wrapper.readBoolean();
    }

    public get id(): number
    {
        return this._id;
    }
    public get username(): string
    {
        return this._username;
    }
    public get motto(): string
    {
        return this._motto;
    }
    public get figure(): string
    {
        return this._figure;
    }
    public get rank(): number
    {
        return this._rank;
    }
    public get rankName(): string
    {
        return this._rankName;
    }
    public get online(): boolean
    {
        return this._online;
    }
    public get lastOnlineAt(): number
    {
        return this._lastOnlineAt;
    }
    public get creditsBalance(): number
    {
        return this._creditsBalance;
    }
    public get ducketsBalance(): number
    {
        return this._ducketsBalance;
    }
    public get diamondsBalance(): number
    {
        return this._diamondsBalance;
    }
    public get email(): string
    {
        return this._email;
    }
    public get ipLast(): string
    {
        return this._ipLast;
    }
    public get isBanned(): boolean
    {
        return this._isBanned;
    }
    public get isMuted(): boolean
    {
        return this._isMuted;
    }
    public get isTradeLocked(): boolean
    {
        return this._isTradeLocked;
    }
}
