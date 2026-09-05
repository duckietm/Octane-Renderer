import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { NowPlayingMessageParser } from '../../parser';

export class NowPlayingMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, NowPlayingMessageParser);
    }

    public getParser(): NowPlayingMessageParser
    {
        return this.parser as NowPlayingMessageParser;
    }
}
