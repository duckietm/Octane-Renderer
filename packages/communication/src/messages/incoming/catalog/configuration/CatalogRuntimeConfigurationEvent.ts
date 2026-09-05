import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CatalogRuntimeConfigurationMessageParser } from '../../../parser/catalog/configuration';

export class CatalogRuntimeConfigurationEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function)
    {
        super(callback, CatalogRuntimeConfigurationMessageParser);
    }

    public getParser(): CatalogRuntimeConfigurationMessageParser
    {
        return this.parser as CatalogRuntimeConfigurationMessageParser;
    }
}
