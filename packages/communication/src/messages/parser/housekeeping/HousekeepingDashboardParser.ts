import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class HousekeepingDashboardParser implements IMessageParser
{
    private _onlineUsers: number = 0;
    private _totalUsers: number = 0;
    private _activeRooms: number = 0;
    private _totalRooms: number = 0;
    private _peakOnlineToday: number = 0;
    private _peakOnlineAllTime: number = 0;
    private _pendingTickets: number = 0;
    private _sanctionsLast24h: number = 0;
    private _serverUptimeSeconds: number = 0;
    private _serverVersion: string = '';

    public flush(): boolean
    {
        this._onlineUsers = 0;
        this._totalUsers = 0;
        this._activeRooms = 0;
        this._totalRooms = 0;
        this._peakOnlineToday = 0;
        this._peakOnlineAllTime = 0;
        this._pendingTickets = 0;
        this._sanctionsLast24h = 0;
        this._serverUptimeSeconds = 0;
        this._serverVersion = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._onlineUsers = wrapper.readInt();
        this._totalUsers = wrapper.readInt();
        this._activeRooms = wrapper.readInt();
        this._totalRooms = wrapper.readInt();
        this._peakOnlineToday = wrapper.readInt();
        this._peakOnlineAllTime = wrapper.readInt();
        this._pendingTickets = wrapper.readInt();
        this._sanctionsLast24h = wrapper.readInt();
        this._serverUptimeSeconds = wrapper.readInt();
        this._serverVersion = wrapper.readString();

        return true;
    }

    public get onlineUsers(): number
    {
        return this._onlineUsers;
    }
    public get totalUsers(): number
    {
        return this._totalUsers;
    }
    public get activeRooms(): number
    {
        return this._activeRooms;
    }
    public get totalRooms(): number
    {
        return this._totalRooms;
    }
    public get peakOnlineToday(): number
    {
        return this._peakOnlineToday;
    }
    public get peakOnlineAllTime(): number
    {
        return this._peakOnlineAllTime;
    }
    public get pendingTickets(): number
    {
        return this._pendingTickets;
    }
    public get sanctionsLast24h(): number
    {
        return this._sanctionsLast24h;
    }
    public get serverUptimeSeconds(): number
    {
        return this._serverUptimeSeconds;
    }
    public get serverVersion(): string
    {
        return this._serverVersion;
    }
}
