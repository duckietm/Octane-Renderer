import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomSettingsErrorParser } from '../../parser';

export class RoomSettingsErrorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomSettingsErrorParser);
    }

    public getParser(): RoomSettingsErrorParser
    {
        return this.parser as RoomSettingsErrorParser;
    }
}
