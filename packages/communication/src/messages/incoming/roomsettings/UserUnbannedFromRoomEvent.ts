import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { UserUnbannedFromRoomParser } from '../../parser';

export class UserUnbannedFromRoomEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UserUnbannedFromRoomParser);
    }

    public getParser(): UserUnbannedFromRoomParser
    {
        return this.parser as UserUnbannedFromRoomParser;
    }
}
