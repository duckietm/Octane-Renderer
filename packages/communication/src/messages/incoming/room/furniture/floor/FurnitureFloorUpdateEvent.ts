import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FurnitureFloorUpdateParser } from '../../../../parser';

export class FurnitureFloorUpdateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FurnitureFloorUpdateParser);
    }

    public getParser(): FurnitureFloorUpdateParser
    {
        return this.parser as FurnitureFloorUpdateParser;
    }
}
