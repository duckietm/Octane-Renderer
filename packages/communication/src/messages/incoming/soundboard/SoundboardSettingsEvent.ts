import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SoundboardSettingsParser } from '../../parser';

export class SoundboardSettingsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SoundboardSettingsParser);
    }

    public getParser(): SoundboardSettingsParser
    {
        return this.parser as SoundboardSettingsParser;
    }
}
