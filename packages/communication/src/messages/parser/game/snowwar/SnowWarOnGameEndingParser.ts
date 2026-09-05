import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { SnowWarGameResultTeamData } from './SnowWarGameResultTeamData';

export class SnowWarOnGameEndingParser implements IMessageParser
{
    private _secondsToResults: number;
    private _teams: SnowWarGameResultTeamData[];

    public flush(): boolean
    {
        this._secondsToResults = 0;
        this._teams = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._secondsToResults = wrapper.readInt();

        let totalTeams = wrapper.readInt();

        while(totalTeams > 0)
        {
            this._teams.push(new SnowWarGameResultTeamData(wrapper));

            totalTeams--;
        }

        return true;
    }

    public get secondsToResults(): number
    {
        return this._secondsToResults;
    }

    public get teams(): SnowWarGameResultTeamData[]
    {
        return this._teams;
    }
}
