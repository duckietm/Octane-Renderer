import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { JukeboxSongDisksMessageParser } from '../../parser';

export class JukeboxSongDisksMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, JukeboxSongDisksMessageParser);
    }

    public getParser(): JukeboxSongDisksMessageParser
    {
        return this.parser as JukeboxSongDisksMessageParser;
    }
}
