import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { PetScratchFailedMessageParser } from './../../parser';

export class PetScratchFailedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, PetScratchFailedMessageParser);
    }

    public getParser(): PetScratchFailedMessageParser
    {
        return this.parser as PetScratchFailedMessageParser;
    }
}
