import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CatalogPageMessageParser } from '../../parser';

export class CatalogPageMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CatalogPageMessageParser);
    }

    public getParser(): CatalogPageMessageParser
    {
        return this.parser as CatalogPageMessageParser;
    }
}
