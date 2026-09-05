import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomSettingsDataParser } from '../../parser';

export class RoomSettingsDataEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomSettingsDataParser);
    }

    public getParser(): RoomSettingsDataParser
    {
        return this.parser as RoomSettingsDataParser;
    }
}
