import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredChestRoomLogsMessageParser } from '../../../parser';

export class WiredChestRoomLogsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredChestRoomLogsMessageParser);
    }

    public getParser(): WiredChestRoomLogsMessageParser
    {
        return this.parser as WiredChestRoomLogsMessageParser;
    }
}
