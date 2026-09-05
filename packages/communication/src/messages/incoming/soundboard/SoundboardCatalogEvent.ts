import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SoundboardCatalogParser } from '../../parser';

export class SoundboardCatalogEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SoundboardCatalogParser);
    }

    public getParser(): SoundboardCatalogParser
    {
        return this.parser as SoundboardCatalogParser;
    }
}
