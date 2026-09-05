import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CraftableProductsMessageParser } from '../../parser';

export class CraftableProductsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CraftableProductsMessageParser);
    }

    public getParser(): CraftableProductsMessageParser
    {
        return this.parser as CraftableProductsMessageParser;
    }
}
