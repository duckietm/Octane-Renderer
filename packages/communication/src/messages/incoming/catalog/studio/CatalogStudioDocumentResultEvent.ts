import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CatalogStudioDocumentResultMessageParser } from '../../../parser/catalog/studio/CatalogStudioDocumentResultMessageParser';

export class CatalogStudioDocumentResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function)
    {
        super(callback, CatalogStudioDocumentResultMessageParser);
    }
    public getParser(): CatalogStudioDocumentResultMessageParser
    {
        return this.parser as CatalogStudioDocumentResultMessageParser;
    }
}
