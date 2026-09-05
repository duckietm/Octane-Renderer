import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CallForHelpResultMessageParser } from '../../parser';

export class CallForHelpResultMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CallForHelpResultMessageParser);
    }

    public getParser(): CallForHelpResultMessageParser
    {
        return this.parser as CallForHelpResultMessageParser;
    }
}
