import { IMessageDataWrapper } from '@octane/api';
import { SnowWarGameResultPlayerData } from './SnowWarGameResultPlayerData';

export class SnowWarGameResultTeamData
{
    private _teamId: number;
    private _score: number;
    private _players: SnowWarGameResultPlayerData[];

    constructor(wrapper: IMessageDataWrapper)
    {
        this._teamId = wrapper.readInt();
        this._score = wrapper.readInt();
        this._players = [];

        let totalPlayers = wrapper.readInt();

        while(totalPlayers > 0)
        {
            this._players.push(new SnowWarGameResultPlayerData(wrapper));

            totalPlayers--;
        }
    }

    public get teamId(): number
    {
        return this._teamId;
    }

    public get score(): number
    {
        return this._score;
    }

    public get players(): SnowWarGameResultPlayerData[]
    {
        return this._players;
    }
}
