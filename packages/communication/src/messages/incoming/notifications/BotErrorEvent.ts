import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { BotErrorEventParser } from '../../parser';

export class BotErrorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BotErrorEventParser);
    }

    public getParser(): BotErrorEventParser
    {
        return this.parser as BotErrorEventParser;
    }
}
