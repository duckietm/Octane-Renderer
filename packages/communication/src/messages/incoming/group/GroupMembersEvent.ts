import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { GroupMembersParser } from '../../parser';

export class GroupMembersEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, GroupMembersParser);
    }

    public getParser(): GroupMembersParser
    {
        return this.parser as GroupMembersParser;
    }
}
