import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { TraxSongInfoMessageParser } from '../../parser';

export class TraxSongInfoMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, TraxSongInfoMessageParser);
    }

    public getParser(): TraxSongInfoMessageParser
    {
        return this.parser as TraxSongInfoMessageParser;
    }
}
