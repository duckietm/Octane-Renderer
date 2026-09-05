import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { YouTubeRoomWatchersParser } from '../../../parser';

export class YouTubeRoomWatchersEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, YouTubeRoomWatchersParser);
    }

    public getParser(): YouTubeRoomWatchersParser
    {
        return this.parser as YouTubeRoomWatchersParser;
    }
}
