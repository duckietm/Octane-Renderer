import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CatalogPublishedMessageParser } from '../../parser';

export class CatalogPublishedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CatalogPublishedMessageParser);
    }

    public getParser(): CatalogPublishedMessageParser
    {
        return this.parser as CatalogPublishedMessageParser;
    }
}
