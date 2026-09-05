import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredRoomSettingsDataParser } from '../../parser';

export class WiredRoomSettingsDataEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredRoomSettingsDataParser);
    }

    public getParser(): WiredRoomSettingsDataParser
    {
        return this.parser as WiredRoomSettingsDataParser;
    }
}
