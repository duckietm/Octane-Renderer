import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomFilterSettingsMessageParser } from '../../parser';

export class RoomFilterSettingsMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomFilterSettingsMessageParser);
    }

    public getParser(): RoomFilterSettingsMessageParser
    {
        return this.parser as RoomFilterSettingsMessageParser;
    }
}
