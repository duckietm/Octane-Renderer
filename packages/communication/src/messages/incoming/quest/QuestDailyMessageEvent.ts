import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { QuestDailyMessageParser } from '../../parser';

export class QuestDailyMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, QuestDailyMessageParser);
    }

    public getParser(): QuestDailyMessageParser
    {
        return this.parser as QuestDailyMessageParser;
    }
}
