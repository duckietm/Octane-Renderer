import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SnowWarUserChatParser } from '../../../parser';

export class SnowWarUserChatEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarUserChatParser);
    }

    public getParser(): SnowWarUserChatParser
    {
        return this.parser as SnowWarUserChatParser;
    }
}
