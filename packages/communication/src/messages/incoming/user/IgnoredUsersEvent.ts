import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { IgnoredUsersParser } from '../../parser';

export class IgnoredUsersEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, IgnoredUsersParser);
    }

    public getParser(): IgnoredUsersParser
    {
        return this.parser as IgnoredUsersParser;
    }
}
