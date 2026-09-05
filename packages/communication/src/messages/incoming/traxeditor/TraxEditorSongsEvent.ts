import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { TraxEditorSongsParser } from '../../parser';

export class TraxEditorSongsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, TraxEditorSongsParser);
    }

    public getParser(): TraxEditorSongsParser
    {
        return this.parser as TraxEditorSongsParser;
    }
}
