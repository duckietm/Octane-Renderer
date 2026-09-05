import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomPollDataParser } from '../../parser';

export class StartRoomPollEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomPollDataParser);
    }

    public getParser(): RoomPollDataParser
    {
        return this.parser as RoomPollDataParser;
    }
}
