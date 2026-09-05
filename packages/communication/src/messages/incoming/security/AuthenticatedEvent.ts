import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { AuthenticatedParser } from '../../parser';

export class AuthenticatedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, AuthenticatedParser);
    }

    public getParser(): AuthenticatedParser
    {
        return this.parser as AuthenticatedParser;
    }
}
