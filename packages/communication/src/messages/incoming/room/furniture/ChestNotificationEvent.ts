import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ChestNotificationMessageParser } from '../../../parser';

export class ChestNotificationEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestNotificationMessageParser);
    }

    public getParser(): ChestNotificationMessageParser
    {
        return this.parser as ChestNotificationMessageParser;
    }
}
