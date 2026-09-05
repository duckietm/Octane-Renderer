import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomEventCancelMessageParser } from '../../parser';

export class RoomEventCancelEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomEventCancelMessageParser);
    }

    public getParser(): RoomEventCancelMessageParser
    {
        return this.parser;
    }
}
