import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SoundboardPlayDeniedParser } from '../../parser';

export class SoundboardPlayDeniedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SoundboardPlayDeniedParser);
    }

    public getParser(): SoundboardPlayDeniedParser
    {
        return this.parser as SoundboardPlayDeniedParser;
    }
}
