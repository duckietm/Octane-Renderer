import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CatalogAdminOfferDetailsMessageParser } from '../../parser';

export class CatalogAdminOfferDetailsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CatalogAdminOfferDetailsMessageParser);
    }

    public getParser(): CatalogAdminOfferDetailsMessageParser
    {
        return this.parser as CatalogAdminOfferDetailsMessageParser;
    }
}
