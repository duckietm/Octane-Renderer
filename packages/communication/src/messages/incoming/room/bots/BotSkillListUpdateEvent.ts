import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { BotSkillListUpdateParser } from '../../../parser';

export class BotSkillListUpdateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BotSkillListUpdateParser);
    }

    public getParser(): BotSkillListUpdateParser
    {
        return this.parser as BotSkillListUpdateParser;
    }
}
