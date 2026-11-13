import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { PluginChannelMessageParser } from '../../parser';

export class PluginChannelMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, PluginChannelMessageParser);
    }

    public getParser(): PluginChannelMessageParser
    {
        return this.parser as PluginChannelMessageParser;
    }
}
