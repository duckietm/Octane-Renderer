import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FurnitureFloorParser } from '../../../../parser';

export class FurnitureFloorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FurnitureFloorParser);
    }

    public getParser(): FurnitureFloorParser
    {
        return this.parser as FurnitureFloorParser;
    }
}
