import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FriendListFragmentParser } from '../../parser';

export class FriendListFragmentEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FriendListFragmentParser);
    }

    public getParser(): FriendListFragmentParser
    {
        return this.parser as FriendListFragmentParser;
    }
}
