import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomInviteErrorParser } from '../../parser';

export class RoomInviteErrorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomInviteErrorParser);
    }

    public getParser(): RoomInviteErrorParser
    {
        return this.parser as RoomInviteErrorParser;
    }
}
