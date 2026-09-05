import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CatalogStudioHistoryMessageParser } from '../../../parser/catalog/studio/CatalogStudioHistoryMessageParser';

export class CatalogStudioHistoryEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function)
    {
        super(callback, CatalogStudioHistoryMessageParser);
    }
    public getParser(): CatalogStudioHistoryMessageParser
    {
        return this.parser as CatalogStudioHistoryMessageParser;
    }
}
