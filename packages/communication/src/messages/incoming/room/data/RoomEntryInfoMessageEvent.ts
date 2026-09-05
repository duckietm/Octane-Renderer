import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomEntryInfoMessageParser } from '../../../parser';

export class RoomEntryInfoMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomEntryInfoMessageParser);
    }

    public getParser(): RoomEntryInfoMessageParser
    {
        return this.parser as RoomEntryInfoMessageParser;
    }
}
