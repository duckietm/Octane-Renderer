import { IMessageEvent } from '@nitrots/api';
import { MessageEvent } from '@nitrots/events';
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
