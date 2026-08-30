import { IMessageEvent } from '@nitrots/api';
import { MessageEvent } from '@nitrots/events';
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
