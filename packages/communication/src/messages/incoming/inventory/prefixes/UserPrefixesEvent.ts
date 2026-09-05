import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { UserPrefixesParser } from '../../../parser';

export class UserPrefixesEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UserPrefixesParser);
    }

    public getParser(): UserPrefixesParser
    {
        return this.parser as UserPrefixesParser;
    }
}
