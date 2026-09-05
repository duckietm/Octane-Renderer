import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FurnitureAliasesParser } from '../../../parser';

export class FurnitureAliasesEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FurnitureAliasesParser);
    }

    public getParser(): FurnitureAliasesParser
    {
        return this.parser as FurnitureAliasesParser;
    }
}
