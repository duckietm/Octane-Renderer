import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { UserEventCatsMessageParser } from '../../parser';

export class UserEventCatsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UserEventCatsMessageParser);
    }

    public getParser(): UserEventCatsMessageParser
    {
        return this.parser as UserEventCatsMessageParser;
    }
}
