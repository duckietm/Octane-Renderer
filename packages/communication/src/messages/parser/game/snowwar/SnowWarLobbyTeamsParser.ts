import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { SnowWarPlayerData } from './SnowWarPlayerData';

export interface ISnowWarArenaData
{
    id: number;
    name: string;
    official: boolean;
}

/**
 * Provisional pre-match line-up sent during the lobby countdown so the client
 * can show the waiting players split into their teams (Red / Blue) before the
 * arena splash. Player records use the SnowWarPlayerData wire shape (objectId
 * is 0 here - the real match, and its object ids, only exists once the
 * countdown ends).
 */
export class SnowWarLobbyTeamsParser implements IMessageParser
{
    private _teamCount: number;
    private _players: SnowWarPlayerData[];
    private _leaderUserId: number;
    private _selectedArenaId: number;
    private _arenas: ISnowWarArenaData[];

    public flush(): boolean
    {
        this._teamCount = 0;
        this._players = [];
        this._leaderUserId = 0;
        this._selectedArenaId = 0;
        this._arenas = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._teamCount = wrapper.readInt();

        let totalPlayers = wrapper.readInt();

        while(totalPlayers > 0)
        {
            this._players.push(new SnowWarPlayerData(wrapper));

            totalPlayers--;
        }

        // Optional leader/arena tail for compatibility with older servers.
        if(!wrapper.bytesAvailable) return true;

        this._leaderUserId = wrapper.readInt();
        this._selectedArenaId = wrapper.readInt();

        let totalArenas = wrapper.readInt();

        while(totalArenas > 0)
        {
            this._arenas.push({
                id: wrapper.readInt(),
                name: wrapper.readString(),
                official: wrapper.readBoolean(),
            });
            totalArenas--;
        }

        return true;
    }

    public get teamCount(): number
    {
        return this._teamCount;
    }

    public get players(): SnowWarPlayerData[]
    {
        return this._players;
    }

    public get leaderUserId(): number
    {
        return this._leaderUserId;
    }

    public get selectedArenaId(): number
    {
        return this._selectedArenaId;
    }

    public get arenas(): ISnowWarArenaData[]
    {
        return this._arenas;
    }
}
