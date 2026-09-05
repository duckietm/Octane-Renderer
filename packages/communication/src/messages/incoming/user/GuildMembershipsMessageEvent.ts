import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { GuildMembershipsMessageParser } from '../../parser';

export class GuildMembershipsMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, GuildMembershipsMessageParser);
    }

    public getParser(): GuildMembershipsMessageParser
    {
        return this.parser as GuildMembershipsMessageParser;
    }
}
