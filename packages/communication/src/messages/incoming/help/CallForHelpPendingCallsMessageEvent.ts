import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CallForHelpPendingCallsMessageParser } from '../../parser';

export class CallForHelpPendingCallsMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CallForHelpPendingCallsMessageParser);
    }

    public getParser(): CallForHelpPendingCallsMessageParser
    {
        return this.parser as CallForHelpPendingCallsMessageParser;
    }
}
