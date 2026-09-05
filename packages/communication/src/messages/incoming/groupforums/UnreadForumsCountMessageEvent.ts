import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { UnreadForumsCountMessageParser } from '../../parser';

export class UnreadForumsCountMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UnreadForumsCountMessageParser);
    }

    public getParser(): UnreadForumsCountMessageParser
    {
        return this.parser as UnreadForumsCountMessageParser;
    }
}
