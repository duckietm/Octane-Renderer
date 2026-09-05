import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FurnitureWallParser } from '../../../../parser';

export class FurnitureWallEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FurnitureWallParser);
    }

    public getParser(): FurnitureWallParser
    {
        return this.parser as FurnitureWallParser;
    }
}
