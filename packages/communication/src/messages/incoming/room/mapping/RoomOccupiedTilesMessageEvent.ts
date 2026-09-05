import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomOccupiedTilesMessageParser } from '../../../parser';

export class RoomOccupiedTilesMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomOccupiedTilesMessageParser);
    }

    public getParser(): RoomOccupiedTilesMessageParser
    {
        return this.parser as RoomOccupiedTilesMessageParser;
    }
}
