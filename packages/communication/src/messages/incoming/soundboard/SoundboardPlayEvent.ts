import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SoundboardPlayParser } from '../../parser';

export class SoundboardPlayEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SoundboardPlayParser);
    }

    public getParser(): SoundboardPlayParser
    {
        return this.parser as SoundboardPlayParser;
    }
}
