import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomPollResultParser } from '../../parser';

export class RoomPollResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomPollResultParser);
    }

    public getParser(): RoomPollResultParser
    {
        return this.parser as RoomPollResultParser;
    }
}
