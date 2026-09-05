import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { Game2WeeklyLeaderboardParser } from '../../../parser';

export class WeeklyCompetitiveLeaderboardEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, Game2WeeklyLeaderboardParser);
    }

    public getParser(): Game2WeeklyLeaderboardParser
    {
        return this.parser as Game2WeeklyLeaderboardParser;
    }
}
