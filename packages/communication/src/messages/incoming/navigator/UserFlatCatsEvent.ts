import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { UserFlatCatsMessageParser } from '../../parser';

export class UserFlatCatsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UserFlatCatsMessageParser);
    }

    public getParser(): UserFlatCatsMessageParser
    {
        return this.parser as UserFlatCatsMessageParser;
    }
}
