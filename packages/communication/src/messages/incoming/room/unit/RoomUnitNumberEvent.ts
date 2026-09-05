import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomUnitNumberParser } from '../../../parser';

export class RoomUnitNumberEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomUnitNumberParser);
    }

    public getParser(): RoomUnitNumberParser
    {
        return this.parser as RoomUnitNumberParser;
    }
}
