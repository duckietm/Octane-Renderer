import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { PetStatusUpdateParser } from '../../../parser';

export class PetStatusUpdateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, PetStatusUpdateParser);
    }

    public getParser(): PetStatusUpdateParser
    {
        return this.parser as PetStatusUpdateParser;
    }
}
