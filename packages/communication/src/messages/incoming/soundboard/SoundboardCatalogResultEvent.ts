import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SoundboardCatalogResultParser } from '../../parser';

export class SoundboardCatalogResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SoundboardCatalogResultParser);
    }

    public getParser(): SoundboardCatalogResultParser
    {
        return this.parser as SoundboardCatalogResultParser;
    }
}
