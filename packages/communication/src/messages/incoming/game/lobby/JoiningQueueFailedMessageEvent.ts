import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { JoiningQueueFailedMessageParser } from '../../../parser';

export class JoiningQueueFailedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, JoiningQueueFailedMessageParser);
    }

    public getParser(): JoiningQueueFailedMessageParser
    {
        return this.parser as JoiningQueueFailedMessageParser;
    }
}
