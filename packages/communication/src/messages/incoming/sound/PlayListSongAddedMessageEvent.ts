import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { PlayListSongAddedMessageParser } from '../../parser';

export class PlayListSongAddedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, PlayListSongAddedMessageParser);
    }

    public getParser(): PlayListSongAddedMessageParser
    {
        return this.parser as PlayListSongAddedMessageParser;
    }
}
