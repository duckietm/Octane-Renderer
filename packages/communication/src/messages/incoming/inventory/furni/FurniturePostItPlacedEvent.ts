import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FurniturePostItPlacedParser } from '../../../parser';

export class FurniturePostItPlacedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FurniturePostItPlacedParser);
    }

    public getParser(): FurniturePostItPlacedParser
    {
        return this.parser as FurniturePostItPlacedParser;
    }
}
