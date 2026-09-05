import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { QuestMessageParser } from '../../parser';

export class QuestMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, QuestMessageParser);
    }

    public getParser(): QuestMessageParser
    {
        return this.parser as QuestMessageParser;
    }
}
