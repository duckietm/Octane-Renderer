import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { GetGuestRoomResultMessageParser } from '../../parser';

export class GetGuestRoomResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, GetGuestRoomResultMessageParser);
    }

    public getParser(): GetGuestRoomResultMessageParser
    {
        return this.parser as GetGuestRoomResultMessageParser;
    }
}
