import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { UserGameAchievementsMessageParser } from '../../../parser';

export class UserGameAchievementsMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UserGameAchievementsMessageParser);
    }

    public getParser(): UserGameAchievementsMessageParser
    {
        return this.parser;
    }
}
