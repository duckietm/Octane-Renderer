import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FurnitureWallUpdateParser } from '../../../../parser';

export class FurnitureWallUpdateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FurnitureWallUpdateParser);
    }

    public getParser(): FurnitureWallUpdateParser
    {
        return this.parser as FurnitureWallUpdateParser;
    }
}
