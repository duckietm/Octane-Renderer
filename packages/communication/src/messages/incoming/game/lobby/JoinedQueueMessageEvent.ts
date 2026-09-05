import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { JoinedQueueMessageParser } from '../../../parser';

export class JoinedQueueMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, JoinedQueueMessageParser);
    }

    public getParser(): JoinedQueueMessageParser
    {
        return this.parser as JoinedQueueMessageParser;
    }
}
