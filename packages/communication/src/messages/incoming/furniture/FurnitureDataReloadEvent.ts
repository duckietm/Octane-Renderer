import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FurnitureDataReloadParser } from '../../parser/furniture/FurnitureDataReloadParser';

export class FurnitureDataReloadEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FurnitureDataReloadParser);
    }

    public getParser(): FurnitureDataReloadParser
    {
        return this.parser as FurnitureDataReloadParser;
    }
}
