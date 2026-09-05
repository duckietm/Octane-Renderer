import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { YoutubeDisplayVideoMessageParser } from '../../../../parser';

export class YoutubeDisplayVideoMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, YoutubeDisplayVideoMessageParser);
    }

    public getParser(): YoutubeDisplayVideoMessageParser
    {
        return this.parser as YoutubeDisplayVideoMessageParser;
    }
}
