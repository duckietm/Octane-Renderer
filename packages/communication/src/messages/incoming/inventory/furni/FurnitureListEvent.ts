import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FurnitureListParser } from '../../../parser';

export class FurnitureListEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FurnitureListParser);
    }

    public getParser(): FurnitureListParser
    {
        return this.parser as FurnitureListParser;
    }
}
