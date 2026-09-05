import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { YouTubeRoomSettingsParser } from '../../../parser';

export class YouTubeRoomSettingsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, YouTubeRoomSettingsParser);
    }

    public getParser(): YouTubeRoomSettingsParser
    {
        return this.parser as YouTubeRoomSettingsParser;
    }
}
