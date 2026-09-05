import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CatalogPageExpirationParser } from '../../parser';

export class CatalogPageExpirationEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CatalogPageExpirationParser);
    }

    public getParser(): CatalogPageExpirationParser
    {
        return this.parser as CatalogPageExpirationParser;
    }
}
