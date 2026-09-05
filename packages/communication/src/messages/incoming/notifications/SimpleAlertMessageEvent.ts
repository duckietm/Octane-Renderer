import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SimpleAlertMessageParser } from '../../parser';

export class SimpleAlertMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SimpleAlertMessageParser);
    }

    public getParser(): SimpleAlertMessageParser
    {
        return this.parser as SimpleAlertMessageParser;
    }
}
