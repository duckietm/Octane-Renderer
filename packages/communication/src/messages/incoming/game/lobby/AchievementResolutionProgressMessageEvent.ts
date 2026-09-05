import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { AchievementResolutionProgressMessageParser } from '../../../parser';

export class AchievementResolutionProgressMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, AchievementResolutionProgressMessageParser);
    }

    public getParser(): AchievementResolutionProgressMessageParser
    {
        return this.parser as AchievementResolutionProgressMessageParser;
    }
}
