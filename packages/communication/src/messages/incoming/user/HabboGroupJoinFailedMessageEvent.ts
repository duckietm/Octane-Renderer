import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { HabboGroupJoinFailedMessageParser } from '../../parser';

export class HabboGroupJoinFailedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HabboGroupJoinFailedMessageParser);
    }

    public getParser(): HabboGroupJoinFailedMessageParser
    {
        return this.parser as HabboGroupJoinFailedMessageParser;
    }
}
