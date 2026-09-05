import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomSettingsUpdatedParser } from '../../parser';

export class RoomSettingsUpdatedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomSettingsUpdatedParser);
    }

    public getParser(): RoomSettingsUpdatedParser
    {
        return this.parser as RoomSettingsUpdatedParser;
    }
}
