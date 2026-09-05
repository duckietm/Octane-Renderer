import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { NoOwnedRoomsAlertMessageParser } from '../../parser';

export class NoOwnedRoomsAlertMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, NoOwnedRoomsAlertMessageParser);
    }

    public getParser(): NoOwnedRoomsAlertMessageParser
    {
        return this.parser;
    }
}
