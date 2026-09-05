import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CallForHelpPendingCallsDeletedMessageParser } from '../../parser';

export class CallForHelpPendingCallsDeletedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CallForHelpPendingCallsDeletedMessageParser);
    }

    public getParser(): CallForHelpPendingCallsDeletedMessageParser
    {
        return this.parser;
    }
}
