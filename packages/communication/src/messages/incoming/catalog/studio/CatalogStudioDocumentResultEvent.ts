import { IMessageEvent } from '@nitrots/api';
import { MessageEvent } from '@nitrots/events';
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
