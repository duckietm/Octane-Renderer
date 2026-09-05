import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { YouTubeRoomBroadcastParser } from '../../../parser';

export class YouTubeRoomBroadcastEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, YouTubeRoomBroadcastParser);
    }

    public getParser(): YouTubeRoomBroadcastParser
    {
        return this.parser as YouTubeRoomBroadcastParser;
    }
}
