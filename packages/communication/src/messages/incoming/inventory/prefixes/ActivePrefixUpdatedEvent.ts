import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ActivePrefixUpdatedParser } from '../../../parser';

export class ActivePrefixUpdatedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ActivePrefixUpdatedParser);
    }

    public getParser(): ActivePrefixUpdatedParser
    {
        return this.parser as ActivePrefixUpdatedParser;
    }
}
