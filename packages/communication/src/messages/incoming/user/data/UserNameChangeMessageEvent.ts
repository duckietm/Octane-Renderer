import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { UserNameChangeMessageParser } from '../../../parser';

export class UserNameChangeMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UserNameChangeMessageParser);
    }

    public getParser(): UserNameChangeMessageParser
    {
        return this.parser as UserNameChangeMessageParser;
    }
}
