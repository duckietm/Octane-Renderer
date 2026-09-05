import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { HousekeepingRoomDetailParser } from '../../parser';

export class HousekeepingRoomDetailEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HousekeepingRoomDetailParser);
    }

    public getParser(): HousekeepingRoomDetailParser
    {
        return this.parser as HousekeepingRoomDetailParser;
    }
}
