import { IMessageEvent } from '@nitrots/api';
import { MessageEvent } from '@nitrots/events';
import { CatalogStudioOperationMessageParser } from '../../../parser/catalog/studio/CatalogStudioOperationMessageParser';

export class CatalogStudioUndoEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function)
    {
        super(callback, CatalogStudioOperationMessageParser);
    }
    public getParser(): CatalogStudioOperationMessageParser
    {
        return this.parser as CatalogStudioOperationMessageParser;
    }
}
