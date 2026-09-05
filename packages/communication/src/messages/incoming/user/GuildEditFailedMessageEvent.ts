import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { GuildEditFailedMessageParser } from '../../parser';

export class GuildEditFailedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, GuildEditFailedMessageParser);
    }

    public getParser(): GuildEditFailedMessageParser
    {
        return this.parser as GuildEditFailedMessageParser;
    }
}
