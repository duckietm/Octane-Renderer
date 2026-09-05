import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { BotAddedToInventoryParser } from '../../parser';

export class BotAddedToInventoryEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BotAddedToInventoryParser);
    }

    public getParser(): BotAddedToInventoryParser
    {
        return this.parser as BotAddedToInventoryParser;
    }
}
