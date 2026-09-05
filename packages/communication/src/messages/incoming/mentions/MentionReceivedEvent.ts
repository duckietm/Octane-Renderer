import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { MentionReceivedParser } from '../../parser';

export class MentionReceivedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, MentionReceivedParser);
    }

    public getParser(): MentionReceivedParser
    {
        return this.parser as MentionReceivedParser;
    }
}
