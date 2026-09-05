import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { BotRemovedFromInventoryParser } from '../../parser';

export class BotRemovedFromInventoryEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BotRemovedFromInventoryParser);
    }

    public getParser(): BotRemovedFromInventoryParser
    {
        return this.parser as BotRemovedFromInventoryParser;
    }
}
