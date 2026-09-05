import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { TraxEditorErrorParser } from '../../parser';

export class TraxEditorErrorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, TraxEditorErrorParser);
    }

    public getParser(): TraxEditorErrorParser
    {
        return this.parser as TraxEditorErrorParser;
    }
}
