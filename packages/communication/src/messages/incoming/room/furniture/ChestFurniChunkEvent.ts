import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ChestFurniChunkMessageParser } from '../../../parser';

export class ChestFurniChunkEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestFurniChunkMessageParser);
    }

    public getParser(): ChestFurniChunkMessageParser
    {
        return this.parser as ChestFurniChunkMessageParser;
    }
}
