import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ProfileAchievementsParser } from '../../../parser';

export class ProfileAchievementsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ProfileAchievementsParser);
    }

    public getParser(): ProfileAchievementsParser
    {
        return this.parser as ProfileAchievementsParser;
    }
}
