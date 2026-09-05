import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { PetInventoryParser } from '../../../parser';

export class PetInventoryEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, PetInventoryParser);
    }

    public getParser(): PetInventoryParser
    {
        return this.parser as PetInventoryParser;
    }
}
