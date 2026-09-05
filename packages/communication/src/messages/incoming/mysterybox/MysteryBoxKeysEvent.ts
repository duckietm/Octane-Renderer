import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { MysteryBoxKeysParser } from '../../parser';

export class MysteryBoxKeysEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, MysteryBoxKeysParser);
    }

    public getParser(): MysteryBoxKeysParser
    {
        return this.parser as MysteryBoxKeysParser;
    }
}
