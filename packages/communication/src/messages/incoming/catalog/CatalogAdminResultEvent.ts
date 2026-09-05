import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CatalogAdminResultMessageParser } from '../../parser';

export class CatalogAdminResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CatalogAdminResultMessageParser);
    }

    public getParser(): CatalogAdminResultMessageParser
    {
        return this.parser as CatalogAdminResultMessageParser;
    }
}
