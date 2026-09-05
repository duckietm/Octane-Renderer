import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { HousekeepingRoomListParser } from '../../parser';

export class HousekeepingRoomListEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HousekeepingRoomListParser);
    }

    public getParser(): HousekeepingRoomListParser
    {
        return this.parser as HousekeepingRoomListParser;
    }
}
