import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomVisitsMessageParser } from '../../parser';

export class RoomVisitsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomVisitsMessageParser);
    }

    public getParser(): RoomVisitsMessageParser
    {
        return this.parser as RoomVisitsMessageParser;
    }
}
