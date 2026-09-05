import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { BannedUsersFromRoomParser } from '../../parser';

export class BannedUsersFromRoomEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BannedUsersFromRoomParser);
    }

    public getParser(): BannedUsersFromRoomParser
    {
        return this.parser as BannedUsersFromRoomParser;
    }
}
