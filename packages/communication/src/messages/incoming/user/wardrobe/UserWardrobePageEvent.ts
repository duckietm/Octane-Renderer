import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { UserWardrobePageParser } from '../../../parser';

export class UserWardrobePageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UserWardrobePageParser);
    }

    public getParser(): UserWardrobePageParser
    {
        return this.parser as UserWardrobePageParser;
    }
}
