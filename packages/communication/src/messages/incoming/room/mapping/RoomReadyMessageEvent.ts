import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomReadyMessageParser } from '../../../parser';

export class RoomReadyMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomReadyMessageParser);
    }

    public getParser(): RoomReadyMessageParser
    {
        return this.parser as RoomReadyMessageParser;
    }
}
