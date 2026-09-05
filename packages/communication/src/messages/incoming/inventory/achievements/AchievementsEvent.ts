import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { AchievementsParser } from '../../../parser';

export class AchievementsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, AchievementsParser);
    }

    public getParser(): AchievementsParser
    {
        return this.parser as AchievementsParser;
    }
}
