import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { GuestRoomSearchResultMessageParser } from '../../parser';

export class GuestRoomSearchResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, GuestRoomSearchResultMessageParser);
    }

    public getParser(): GuestRoomSearchResultMessageParser
    {
        return this.parser as GuestRoomSearchResultMessageParser;
    }
}
