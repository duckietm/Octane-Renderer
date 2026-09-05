import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CatalogPageWithEarliestExpiryMessageParser } from '../../parser';

export class CatalogPageWithEarliestExpiryMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CatalogPageWithEarliestExpiryMessageParser);
    }

    public getParser(): CatalogPageWithEarliestExpiryMessageParser
    {
        return this.parser as CatalogPageWithEarliestExpiryMessageParser;
    }
}
