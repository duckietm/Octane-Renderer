import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomEventMessageParser } from '../../parser';

export class RoomEventEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomEventMessageParser);
    }

    public getParser(): RoomEventMessageParser
    {
        return this.parser as RoomEventMessageParser;
    }
}
