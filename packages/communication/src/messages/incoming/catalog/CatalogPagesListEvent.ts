import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CatalogIndexMessageParser } from '../../parser';

export class CatalogPagesListEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CatalogIndexMessageParser);
    }

    public getParser(): CatalogIndexMessageParser
    {
        return this.parser as CatalogIndexMessageParser;
    }
}
