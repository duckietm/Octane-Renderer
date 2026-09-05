import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { UserCurrentBadgesParser } from '../../../parser';

export class UserCurrentBadgesEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UserCurrentBadgesParser);
    }

    public getParser(): UserCurrentBadgesParser
    {
        return this.parser as UserCurrentBadgesParser;
    }
}
