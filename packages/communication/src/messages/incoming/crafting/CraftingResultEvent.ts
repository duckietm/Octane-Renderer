import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CraftingResultMessageParser } from '../../parser';

export class CraftingResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CraftingResultMessageParser);
    }

    public getParser(): CraftingResultMessageParser
    {
        return this.parser as CraftingResultMessageParser;
    }
}
