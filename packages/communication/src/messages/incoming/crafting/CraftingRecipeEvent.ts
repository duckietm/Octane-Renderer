import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CraftingRecipeMessageParser } from '../../parser';

export class CraftingRecipeEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CraftingRecipeMessageParser);
    }

    public getParser(): CraftingRecipeMessageParser
    {
        return this.parser as CraftingRecipeMessageParser;
    }
}
