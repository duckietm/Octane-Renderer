import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomChatSettingsParser } from '../../../parser';

export class RoomChatSettingsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomChatSettingsParser);
    }

    public getParser(): RoomChatSettingsParser
    {
        return this.parser as RoomChatSettingsParser;
    }
}
