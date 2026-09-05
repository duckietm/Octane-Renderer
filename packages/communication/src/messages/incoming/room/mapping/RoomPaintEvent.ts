import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomPaintParser } from '../../../parser';

export class RoomPaintEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomPaintParser);
    }

    public getParser(): RoomPaintParser
    {
        return this.parser as RoomPaintParser;
    }
}
