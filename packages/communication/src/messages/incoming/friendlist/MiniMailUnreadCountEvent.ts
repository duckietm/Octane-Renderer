import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { MiniMailUnreadCountParser } from '../../parser';

export class MiniMailUnreadCountEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, MiniMailUnreadCountParser);
    }

    public getParser(): MiniMailUnreadCountParser
    {
        return this.parser as MiniMailUnreadCountParser;
    }
}
