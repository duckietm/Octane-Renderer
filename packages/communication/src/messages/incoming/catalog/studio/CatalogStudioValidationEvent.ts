import { IMessageEvent } from '@nitrots/api';
import { MessageEvent } from '@nitrots/events';
import { CatalogStudioValidationMessageParser } from '../../../parser/catalog/studio/CatalogStudioValidationMessageParser';

export class CatalogStudioValidationEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function)
    {
        super(callback, CatalogStudioValidationMessageParser);
    }
    public getParser(): CatalogStudioValidationMessageParser
    {
        return this.parser as CatalogStudioValidationMessageParser;
    }
}
