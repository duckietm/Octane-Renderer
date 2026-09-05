import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { QuestCompletedMessageParser } from '../../parser';

export class QuestCompletedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, QuestCompletedMessageParser);
    }

    public getParser(): QuestCompletedMessageParser
    {
        return this.parser as QuestCompletedMessageParser;
    }
}
