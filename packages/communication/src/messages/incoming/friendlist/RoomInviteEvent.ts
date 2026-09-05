import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomInviteParser } from '../../parser';

export class RoomInviteEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomInviteParser);
    }

    public getParser(): RoomInviteParser
    {
        return this.parser as RoomInviteParser;
    }
}
